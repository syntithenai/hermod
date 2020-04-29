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

import multiprocessing
#import playsound
#import simpleaudio 
import sounddevice as sd
import soundfile as sf
from urllib.request import urlopen
import subprocess

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
        # hermod/' + self.site + '/asr/start,hermod/' + self.site + '/asr/stop,
        self.subscribe_to = 'hermod/rasa/ready,hermod/' + self.site + '/asr/start,hermod/' + self.site + \
            '/microphone/start,hermod/' + self.site + '/microphone/stop,hermod/' + self.site + '/speaker/#'
        self.microphone_buffer=[]
        self.vad = webrtcvad.Vad(config['services']['AudioService'].get('vad_sensitivity',0))
        self.speaking = False
        self.force_stop_play = False
        self.current_volume = None
       
    async def on_message(self, msg):
        topic = "{}".format(msg.topic)
        #self.log('AUDIO SERVice {}'.format(topic))
        if topic == 'hermod/' + self.site + '/microphone/start':
            self.started = True
        elif topic == 'hermod/' + self.site + '/microphone/stop':
            self.started = False
        
        # mute mic when listening
        elif topic == 'hermod/' + self.site + '/asr/start':
            await self.mute_volume()
        elif topic == 'hermod/' + self.site + '/asr/text' or topic == 'hermod/' + self.site + '/asr/stop':
            await self.restore_volume()
    
            
        elif topic.startswith('hermod/' + self.site + '/speaker/play'):
            payload = {}
            try:
                payload = json.loads(msg.payload)
            except Exception as e:
                self.log(e)
            self.log("payload")
            self.log(payload)
            ptl = len('hermod/' + self.site + '/speaker/play') + 1
            playId = topic[ptl:]
            if 'url' in payload:
                await self.start_playing_url(payload.get('url'), playId)
            else:
                await self.start_playing(msg.payload, playId)
        elif topic == 'hermod/' + self.site + '/speaker/stop':
            ptl = len('hermod/' + self.site + '/speaker/play') + 1
            playId = topic[ptl:]
            await self.stop_playing(playId)
        elif topic == 'hermod/' + self.site + '/speaker/volume':
            payload = {}
            # self.log("DqM MESSAGE {} - {} - {}".format(site,topic,msg.payload))
            try:
                payload = json.loads(payload_text)
                if ('volume' in payload):
                    self.set_volume(payload.get('volume'))
            except Exception as e:
                self.log(e)
            
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
        elif topic == 'hermod/'+self.site+'/timeout':
            pass
            # this_folder = os.path.dirname(os.path.realpath(__file__))
            # wav_file = os.path.join(this_folder, 'turn_off.wav')
            # f = open(wav_file, "rb")
            # wav = f.read();
            # await self.client.publish('hermod/'+self.site+'/speaker/play',wav)
            
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
        if len(self.microphone_buffer) > 2:
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
      
    
    async def play_buffer(self,buffer, **kwargs):
        loop = asyncio.get_event_loop()
        event = asyncio.Event()
        idx = 0

        def callback(outdata, frame_count, time_info, status):
            # await asyncio.sleep(0.000001)
            nonlocal idx
            #if status:
                #print(status)
            remainder = len(buffer) - idx
            if remainder == 0:
                loop.call_soon_threadsafe(event.set)
                raise sd.CallbackStop
            valid_frames = frame_count if remainder >= frame_count else remainder
            outdata[:valid_frames] = buffer[idx:idx + valid_frames]
            outdata[valid_frames:] = 0
            idx += valid_frames

        stream = sd.OutputStream(callback=callback, dtype=buffer.dtype,
                                 channels=buffer.shape[1], **kwargs)
        with stream:
            await event.wait()

    async def start_playing_url(self, url, playId = ''):
        self.log('start playing')
        # self.force_stop_play = False;
        await self.client.publish("hermod/" + self.site + "/speaker/started", json.dumps({"play_id": playId}))
        with sf.SoundFile(io.BytesIO(urlopen(url).read()),'r+') as f:
            # try slow read
            # while f.tell() < f.__len__():
                # pos = f.tell()
                # audio = f.read(1, always_2d=True, dtype='float32')
                # await self.play_buffer(audio ,samplerate = f.samplerate)
                
            
            # self.log(f)
            # f.seek(0, 2)
            # frames = f.tell()
            # f.seek(0)
            # self.log('freames {}'.format(frames))
            # #audio = f.read(64, always_2d=True, dtype='float32')
            #self.log(audio)
            # while True:
                # pos = f.tell()
            audio = f.read(-1, always_2d=True, dtype='float32')
            await self.play_buffer(audio ,samplerate = f.samplerate)
            
               
        await self.client.publish("hermod/" + self.site +
                                 "/speaker/finished", json.dumps({"play_id": playId}))
        self.log('sent  p started')
                    
    async def start_playing(self, wav, playId = ''):
        self.log('start playing')
        # self.force_stop_play = False;
        await self.client.publish("hermod/" + self.site + "/speaker/started", json.dumps({"play_id": playId}))
        with sf.SoundFile(io.BytesIO(bytes(wav))) as f:
            # slow read
            # while f.tell() < f.__len__():
                # pos = f.tell()
                # audio = f.read(1024, always_2d=True, dtype='float32')
                # await self.play_buffer(audio ,samplerate = f.samplerate)

            # self.log(f)
            # f.seek(0, 2)
            # frames = f.tell()
            # f.seek(0)
            # self.log('freames {}'.format(frames))
            # #audio = f.read(64, always_2d=True, dtype='float32')
            #self.log(audio)
            # while True:
                # pos = f.tell()
            audio = f.read(-1, always_2d=True, dtype='float32')
            await self.play_buffer(audio ,samplerate = f.samplerate)
            
               
        await self.client.publish("hermod/" + self.site +
                                 "/speaker/finished", json.dumps({"play_id": playId}))
        self.log('sent  p started')
  
                
    async def stop_playing(self, playId):
        self.log('stop playing')
        self.force_stop_play = True;
        # self.log('set force stop play')
        # if hasattr(self,'wf'):
            # self.log('close WF real')
            # self.wf.close()
        # if hasattr(self,'speakerstream'):
            # self.log('set force stop play real')
            # self.speakerstream.stop_stream()
            # self.speakerstream.close()
        # if hasattr(self,'player'):
            # self.log('real stop playing')
        
            # simpleaudio.stop_all()
        #p.terminate()
        await self.client.publish("hermod/" + self.site +
                            "/speaker/finished", json.dumps({"play_id": playId}))       

    # PULSE BASED VOLUME FUNCTIONS SET MASTER VOLUME
    # TODO - extract output device detection and run on init so device name can be used here to replace pulse
    def set_volume(self,volume):
        self.log('SET VOLUME '+str(volume))
        # get current volume
        subprocess.call(["amixer", "-D", "pulse", "sset", "Master", str(volume)+"%"])
        self.current_volume = None

    async def mute_volume(self):
        self.log('MUTE VOLUME ')
        self.current_volume = subprocess.getoutput("amixer sget Master | grep 'Right:' | awk -F'[][]' '{ print $2 }'")
        await self.client.subscribe('hermod/'+self.site+'/asr/stop')
        subprocess.call(["amixer", "-D", "pulse", "sset", "Master", "5%"])
        
    async def restore_volume(self):
        self.log('RESTORE VOLUME {}'.format(self.current_volume))
        if self.current_volume != None:
            restore_to = self.current_volume
            # if not float(restore_to) > 0: 
                # restore_to = 0
            subprocess.call(["amixer", "-D", "pulse", "sset", "Master", '{}'.format(restore_to)])
            self.current_volume = None
            await self.client.unsubscribe('hermod/'+self.site+'/asr/stop')


                            
#                 amixer -D pulse sset Master 0%           
# call(["amixer", "-D", "pulse", "sset", "Master", "0%"])
# To increase The volume by 10%:

# call(["amixer", "-D", "pulse", "sset", "Master", "10%+"])
# To decrease The volume by 10%:

# call(["amixer", "-D", "pulse", "sset", "Master", "10%-"])                                 
        
    # while len(audio) > 0 :
                
                # #if  not self.force_stop_play:
                # await self.play_buffer(audio ,samplerate = f.samplerate)
                # audio = f.read(1, always_2d=True, dtype='float32')
            #    self.log('looop')
        
        #self.player = multiprocessing.Process(target=playsound, args=(wav,playId))
        # #with sf.SoundFile(io.BytesIO(bytes(wav)), 'r+'):
            
        # wf = wave.open(io.BytesIO(bytes(wav)), 'rb')
        # #data, fs = sf.read(io.BytesIO(bytes(wav)), dtype='float32')
        # to_play = np.asarray(bytes(wav), dtype='float32')
        
        
        # self.log('start playing read data {}'.format(wf))
        # #data, fs = sf.read(args.filename, dtype='float32')
        # #sd.play(data, fs) #, device=args.device)
        # # to_play = np.array((data, dtype='float32')
        # # await self.play_buffer(to_play)
        # # self.log('start playing sent play')
        # #status = sd.wait()
        # #self.log('done playing real p {}'.format(status))
        # # await self.start_playing_real(wav,playId)
        # #wf = wave.open(io.BytesIO(bytes(wav)), 'rb')
        # # self.player = simpleaudio.play_buffer(bytes(wav), wf.getnchannels(), 2, wf.getframerate())
        # #buffer = np.empty((frames, channels), dtype='float32')
        # #buffer = np.array(bytes(wav), dtype='float32')
        
        # #await self.play_buffer(buffer)
        # #self.player.start()
        # self.log('send  p started')
        
  
    # async def start_playing_real(self, wav, playId=''):
        # self.log('start playing real')
        # #self.log(wav)
        # pa = self.p
        # info = pa.get_host_api_info_by_index(0)
        # numdevices = info.get('deviceCount')
        # useIndex = -1
        # # device from config, first match
        # devices = []
        # device = self.config['services']['AudioService'].get('outputdevice',False)
        # if not device:
            # device = 'default'
        # for i in range(0, numdevices):
            # if useIndex < 0 and pa.get_device_info_by_host_api_device_index(0, i).get('maxOutputChannels') > 0:
                # devices.append(pa.get_device_info_by_host_api_device_index(0, i).get('name'))
                # if device in pa.get_device_info_by_host_api_device_index(0, i).get('name') :
                    # # only use the first found
                    # if useIndex < 0:
                        # useIndex = i
        # if useIndex < 0:
            # self.log('no suitable speaker device')
            # self.log('Available output devices:')
            # self.log(devices)
        # else:
            # self.log(['SPEAKER USE DEV',useIndex,pa.get_device_info_by_host_api_device_index(0,useIndex)])
            # self.log('Available output devices:')
            # self.log(devices)
            # # remaining = len(wav)
            # # wf = wave.open(io.BytesIO(bytes(wav)), 'rb')
            # # CHUNK = 256
            # # stream = pa.open(format=pa.get_format_from_width(wf.getsampwidth()),
                            # # channels=wf.getnchannels(),
                            # # rate=wf.getframerate(),
                            # # output=True) #, output_device_index=useIndex)
            # # self.speakerstream = stream
            
            # # data = wf.readframes(CHUNK)
            # # remaining = remaining - CHUNK
            # # while data is not None and remaining > 0: # and not self.force_stop_play:
                # # stream.write(data)
                # # data = wf.readframes(CHUNK)
                # # remaining = remaining - CHUNK
                # # # await asyncio.sleep(0.000000000001)
            # # stream.stop_stream()
            # # stream.close()
            
              
            # # # instantiate self.p (1)
            # # # define callback (2)
            # def callback(in_data, frame_count, time_info, status):
                # data = []
                # self.log('callback {}'.format(self.force_stop_play))
                # if self.force_stop_play != True:
                 # #   self.log('callback plauy')
                    # time.sleep(0.01)
                    # data = wf.readframes(1) #frame_count)
                    # return (data, pyaudio.paContinue)
                # else:
                    # return (data, pyaudio.paAbort)
            
            # wf = wave.open(io.BytesIO(bytes(wav)), 'rb')
            # self.wf = wf
            # # open stream using callback (3)
            # stream = self.p.open(format=self.p.get_format_from_width(wf.getsampwidth()),
                            # channels=wf.getnchannels(),
                            # rate=wf.getframerate(),
                            # output=True, output_device_index=useIndex,
                            # stream_callback=callback)
            # self.speakerstream = stream
            # # start the stream (4)
            # stream.start_stream()

            # # wait for stream to finish (5)
            # while stream.is_active: #) and self.force_stop_play != True:
                # await asyncio.sleep(0.5)
                # self.log('stream active {}'.format(self.force_stop_play))
                
                

            # # stop stream (6)
            # stream.stop_stream()
            # stream.close()
            # wf.close()
 
        # #p.terminate()
    # # async def start_playing_loop(self,data,stream,remaining, CHUNK):
        # # while data is not None and remaining > 0:
                # # stream.write(data)
                # # data = wf.readframes(CHUNK)
                # # remaining = remaining - CHUNK
