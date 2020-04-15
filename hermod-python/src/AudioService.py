"""
This class captures audio from the available hardware and streams mqtt audio packets
Streaming is enabled by a microphone/start message and stopped by microphone/stop
This service is preconfigured for a single site.
"""

import wave
import io
import os
import pyaudio
import time
import json
import asyncio
import webrtcvad
import numpy as np

from MqttService import MqttService


class AudioService(MqttService):
    """
    AudioService Service Class
    """
    def __init__(self,config,loop):
        super(AudioService,self).__init__(config,loop)
        self.config = config
        self.p = pyaudio.PyAudio()
        self.site = config['services']['AudioService'].get('site','default')
        # self.log('MIC constructor {}'.format(self.site))
        #self.thread_targets.append(self.send_audio_frames)
        self.also_run=[self.send_audio_frames]
        self.started = False
        self.subscribe_to = 'hermod/rasa/ready,hermod/' + self.site + \
            '/microphone/start,hermod/' + self.site + '/microphone/stop,hermod/' + self.site + '/speaker/#'
        self.volume = 5
        self.microphone_buffer=[]
        self.vad = webrtcvad.Vad(config['services']['AudioService'].get('vad_sensitivity',0))
        self.speaking = False
       
    async def on_message(self, msg):
        topic = "{}".format(msg.topic)
        #self.log('AUDIO SERVice {}'.format(topic))
        if topic == 'hermod/' + self.site + '/microphone/start':
            self.started = True
        elif topic == 'hermod/' + self.site + '/microphone/stop':
            self.started = False
        elif topic.startswith('hermod/' + self.site + '/speaker/play'):
            ptl = len('hermod/' + self.site + '/speaker/play') + 1
            playId = topic[ptl:]
            await self.start_playing(msg.payload, playId)
        elif topic == 'hermod/' + self.site + '/speaker/stop':
            ptl = len('hermod/' + self.site + '/speaker/play') + 1
            playId = topic[ptl:]
            await self.stop_playing(playId)
        elif topic == 'hermod/' + self.site + '/speaker/volume':
            self.volume = msg.payload
        elif topic == 'hermod/rasa/ready':
            await self.client.publish('hermod/'+self.site+'/hotword/activate',json.dumps({}))
            await self.client.publish('hermod/'+self.site+'/asr/activate',json.dumps({}))
            await self.client.publish('hermod/'+self.site+'/microphone/start',json.dumps({}))
            await self.client.publish('hermod/'+self.site+'/hotword/start',json.dumps({}))
            this_folder = os.path.dirname(os.path.realpath(__file__))
            wav_file = os.path.join(this_folder, 'loaded.wav')
            f = open(wav_file, "rb")
            wav = f.read();
            await self.client.publish('hermod/'+self.site+'/speaker/play',wav)
            
    async def send_microphone_buffer(self):
        if hasattr(self,'client'):
            for a in self.microphone_buffer:
                topic = 'hermod/' + self.site + '/microphone/audio'
                await self.client.publish(
                    topic, payload=a, qos=0)
            self.microphone_buffer = []
        
    def save_microphone_buffer(self,frame):
        self.microphone_buffer.append(frame)
        # ring buffer
        if len(self.microphone_buffer) > 3:
            self.microphone_buffer.pop(0)

    async def send_audio_frames(self):
        # determine which audio device
        info = self.p.get_host_api_info_by_index(0)
        numdevices = info.get('deviceCount')
        useIndex = -1
            
        # device from config, first match
        devices = []
        device = self.config['services']['AudioService'].get('inputdevice',False)
        if not device:
            device = 'default'
        for i in range(0, numdevices):
            if useIndex < 0 and self.p.get_device_info_by_host_api_device_index(0, i).get('maxInputChannels') > 0:
                devices.append(self.p.get_device_info_by_host_api_device_index(0, i).get('name'))
                if device in self.p.get_device_info_by_host_api_device_index(0, i).get('name') :
                    # only use the first found
                    if useIndex < 0:
                        useIndex = i
       
        
        #useIndex = 2
        if useIndex < 0:
            self.log('no suitable microphone device')
            self.log('Available input devices:')
            self.log(devices)
        else:
            self.log(['Microphone USE DEV',useIndex,self.p.get_device_info_by_host_api_device_index(0,useIndex)])
            self.log('Available input devices:')
            self.log(devices)
            
            stream = self.p.open(
                format=pyaudio.paInt16,
                channels=1,
                rate=16000,
                input=True,
                frames_per_buffer=256, input_device_index=useIndex)
            speak_count = 0
            silence_count = 0
            speaking = False
            while True:
                await asyncio.sleep(0.000001)
                frames = stream.read(256, exception_on_overflow = False)
                    
                if self.started:
                    buffer = np.frombuffer(frames, np.int16)
                    frame_slice = buffer[0:160].tobytes()
                    # self.log("valid {}".format(webrtcvad.valid_rate_and_frame_length(16000,len(frame_slice))))
                    is_speech = self.vad.is_speech(frame_slice, 16000)
                    if is_speech:
                        # prepend buffer on first speech
                        if speak_count == 0:
                            await self.send_microphone_buffer()
                        speaking = True
                        speak_count = speak_count + 1
                        silence_count = 0
                    else:
                        #asyncio.sleep(0.5)
                        silence_count = silence_count + 1
                        if silence_count > 20:
                            #self.log('MICROPHONE SILENCE TIMEOUT')
                            speaking = False
                            speak_count = 0
                        
                    if speaking:
                        topic = 'hermod/' + self.site + '/microphone/audio'
                        await self.client.publish(
                            topic, payload=frames, qos=0)
                    else:
                        self.save_microphone_buffer(frames)
                else:
                    self.silence_count=0
                    self.speak_count=0
            stream.stop_stream()
            stream.close();
            
    async def start_playing(self, wav, playId = ''):
        self.force_stop_play = False;
        await self.client.publish("hermod/" + self.site + "/speaker/started", json.dumps({"id": playId}))
        info = self.p.get_host_api_info_by_index(0)
        numdevices = info.get('deviceCount')
        useIndex = -1
        # device from config, first match
        devices = []
        device = self.config['services']['AudioService'].get('outputdevice',False)
        if not device:
            device = 'default'
        for i in range(0, numdevices):
            if useIndex < 0 and self.p.get_device_info_by_host_api_device_index(0, i).get('maxOutputChannels') > 0:
                devices.append(self.p.get_device_info_by_host_api_device_index(0, i).get('name'))
                if device in self.p.get_device_info_by_host_api_device_index(0, i).get('name') :
                    # only use the first found
                    if useIndex < 0:
                        useIndex = i
        if useIndex < 0:
            self.log('no suitable speaker device')
            self.log('Available output devices:')
            self.log(devices)
        else:
            # self.log(['SPEAKER USE DEV',useIndex,self.p.get_device_info_by_host_api_device_index(0,useIndex)])
            # self.log('Available output devices:')
            # self.log(devices)
            remaining = len(wav)
            wf = wave.open(io.BytesIO(bytes(wav)), 'rb')
            CHUNK = 256
            stream = self.p.open(format=self.p.get_format_from_width(wf.getsampwidth()),
                            channels=wf.getnchannels(),
                            rate=wf.getframerate(),
                            output=True, output_device_index=useIndex)
            self.speakerstream = stream
            
            data = wf.readframes(CHUNK)
            remaining = remaining - CHUNK
            while data is not None and remaining > 0 and not self.force_stop_play:
                stream.write(data)
                data = wf.readframes(CHUNK)
                remaining = remaining - CHUNK
                # await asyncio.sleep(0.000000000001)
            stream.stop_stream()
            stream.close()
            await self.client.publish("hermod/" + self.site +
                                "/speaker/finished", json.dumps({"id": playId}))
            
        #p.terminate()
    async def start_playing_loop(self,data,stream,remaining, CHUNK):
        while data is not None and remaining > 0:
                stream.write(data)
                data = wf.readframes(CHUNK)
                remaining = remaining - CHUNK
                
    async def stop_playing(self, playId):
        self.force_stop_play = True;
        self.log('set force stop play')
        if hasattr(self,'stream'):
            self.speakerstream.stop_stream()
            self.speakerstream.close()
        # if hasattr(self,'p'):
            # self.p.terminate()
        #p.terminate()
        await self.client.publish("hermod/" + self.site +
                            "/speaker/finished", json.dumps({"id": playId}))            
        
