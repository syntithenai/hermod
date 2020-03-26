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

from mqtt_service import MqttService


class AudioService(MqttService):
    """
    AudioService Service Class
    """
    def __init__(self,config):
        super(AudioService,self).__init__(config)
        self.config = config
        self.p = pyaudio.PyAudio()
        self.site = config['services']['AudioService'].get('site','default')
        # self.log('MIC constructor {}'.format(self.site))
        self.thread_targets.append(self.send_audio_frames)
        self.started = False
        self.subscribe_to = 'hermod/rasa/ready,hermod/' + self.site + \
            '/microphone/start,hermod/' + self.site + '/microphone/stop,hermod/' + self.site + '/speaker/#'
        self.volume = 5
       
    def on_message(self, client, userdata, msg):
        topic = "{}".format(msg.topic)
        self.log('AUDIO SERVice {}'.format(topic))
        if topic == 'hermod/' + self.site + '/microphone/start':
            self.started = True
        elif topic == 'hermod/' + self.site + '/microphone/stop':
            self.started = False
        elif topic.startswith('hermod/' + self.site + '/speaker/play'):
            ptl = len('hermod/' + self.site + '/speaker/play') + 1
            playId = topic[ptl:]
            self.start_playing(msg.payload, playId)
        elif topic == 'hermod/' + self.site + '/speaker/stop':
            self.stop_playing(playId)
        elif topic == 'hermod/' + self.site + '/speaker/volume':
            self.volume = msg.payload
        elif topic == 'hermod/rasa/ready':
            self.client.publish('hermod/'+self.site+'/hotword/activate',json.dumps({}))
            self.client.publish('hermod/'+self.site+'/asr/activate',json.dumps({}))
            self.client.publish('hermod/'+self.site+'/microphone/start',json.dumps({}))
            self.client.publish('hermod/'+self.site+'/hotword/start',json.dumps({}))
            this_folder = os.path.dirname(os.path.realpath(__file__))
            wav_file = os.path.join(this_folder, 'loaded.wav')
            f = open(wav_file, "rb")
            wav = f.read();
            self.client.publish('hermod/'+self.site+'/speaker/play',wav)
            

    def send_audio_frames(self, run_event):
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
            # self.log('choose audio device1.6')
            # self.log(stream)
            while True and run_event.is_set():
                #self.log('-')
                    
                time.sleep(0.01)
                #self.log('0')
               
                frames = stream.read(256, exception_on_overflow = False)
               # self.log(':')
                if self.started:
                   # self.log('.')
                    # generate wav file in memory
                    # output = io.BytesIO()
                    # waveFile = wave.open(output, "wb")
                    # waveFile.setnchannels(1)
                    # waveFile.setsampwidth(2)
                    # waveFile.setframerate(16000)
                    # waveFile.writeframes(frames)
                    topic = 'hermod/' + self.site + '/microphone/audio'
                    # # strip wav header
                    # payload = output.getvalue()
                    # payload = payload[43:]
                    self.client.publish(
                        topic, payload=frames, qos=0)
            stream.stop_stream()
            stream.close();
            
    def start_playing(self, wav, playId = ''):
        # self.log('st p[l')  
        # self.log(self.client)
        # self.log(json.dumps({"id": playId}))
        self.client.publish("hermod/" + self.site + "/speaker/started", json.dumps({"id": playId}))
        # self.log('st p[l2')  
        # self.log(self.p)
        info = self.p.get_host_api_info_by_index(0)
        # self.log('st p[l23')  
        numdevices = info.get('deviceCount')
        # self.log('st p[l24')  
        useIndex = -1
        # self.log('st p[l25')    
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
       
        
        #useIndex = 2
        if useIndex < 0:
            self.log('no suitable speaker device')
            self.log('Available output devices:')
            self.log(devices)
        else:
            self.log(['SPEAKER USE DEV',useIndex,self.p.get_device_info_by_host_api_device_index(0,useIndex)])
            self.log('Available output devices:')
            self.log(devices)
            remaining = len(wav)
            wf = wave.open(io.BytesIO(bytes(wav)), 'rb')
            CHUNK = 256
            stream = self.p.open(format=self.p.get_format_from_width(wf.getsampwidth()),
                            channels=wf.getnchannels(),
                            rate=wf.getframerate(),
                            output=True, output_device_index=useIndex)

            data = wf.readframes(CHUNK)
            remaining = remaining - CHUNK
            #self.log('first')
            while data is not None and remaining > 0:
                #self.log('next1')
                stream.write(data)
                #self.log('next2')
                data = wf.readframes(CHUNK)
                #self.log('next3')
                remaining = remaining - CHUNK
                #self.log('next4')
            # self.log('last')
            self.client.publish("hermod/" + self.site +
                                "/speaker/finished", json.dumps({"id": playId}))
            stream.stop_stream()
            stream.close()

        #p.terminate()

    def stop_playing(self, playId):
        stream.stop_stream()
        stream.close()

        #p.terminate()
        self.client.publish("hermod/" + self.site +
                            "/speaker/finished", json.dumps({"id": playId}))            
        
