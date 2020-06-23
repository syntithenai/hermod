"""
This class captures audio from the available hardware and streams mqtt audio packets
Streaming is enabled by a microphone/start message and stopped by microphone/stop
The service also acts on speaker/play messages and others...
This service is preconfigured for a single site suitable for use in standalone or satellite configurations.
"""

import wave
import io
import os
import aiofiles
import pyaudio
import time
import json
import asyncio
import webrtcvad
import numpy as np
import filetype
import concurrent.futures
import multiprocessing
import sounddevice as sd
import soundfile as sf
from urllib.request import urlopen
import subprocess
from pydub import AudioSegment
from pydub.playback import play

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
        # how many mic frames to send per mqtt message
        self.FRAMES_PER_BUFFER = 1024 #256
        self.also_run=[self.send_audio_frames]
        self.started = False
        self.subscribe_to = 'hermod/rasa/ready,hermod/' + self.site + '/asr/#,hermod/' + self.site + \
            '/microphone/start,hermod/' + self.site + '/microphone/stop,hermod/' + self.site + '/speaker/#'
        self.microphone_buffer=[]
        # integer between 0 and 3. 0 is the least aggressive about filtering out non-speech, 3 is the most aggressive
        self.vad = webrtcvad.Vad(3) #webrtcvad.Vad(config['services']['AudioService'].get('vad_sensitivity',2))
        self.speaking = False
        self.force_stop_play = False
        # force start at 75% volume
        self.current_volume = '75%'
        subprocess.call(["amixer", "-D", "pulse", "sset", "Master", "75%"])
        self.speaker_cache=[]
        self.speaker_is_playing = False
        # await self.client.publish('hermod/'+self.site+'/dialog/init',json.dumps({"platform":"python","supports":["audio"]}))
            
    async def on_connect(self):
        # wait for dialog manager to start
        await asyncio.sleep(2)
        await self.client.publish('hermod/'+self.site+'/dialog/init',json.dumps({"platform":"python","supports":["audio"]}))
        
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
    
        elif topic.startswith('hermod/' + self.site + '/speaker/cache'):
            # limit length of direct audio, alt use url streaming for unlimited
            if len(self.speaker_cache) < 800:
                self.speaker_cache.append(msg.payload)
        elif topic.startswith('hermod/' + self.site + '/speaker/play'):
            ptl = len('hermod/' + self.site + '/speaker/play') + 1
            self.speaker_is_playing = True
            playId = topic[ptl:]
            if not len(playId) > 0:
                playId='no_id'
            payload = {}
            try:
                payload = json.loads(msg.payload)
            except Exception as e:
                pass
            if payload.get('url',False):
                await self.start_playing_url(payload.get('url'), playId)
            
            elif payload.get('sound',False):
                await self.play_sound(payload.get('sound'),self.site, playId)
            
            else:
                self.speaker_cache.append(msg.payload)
                await self.start_playing(b"".join(self.speaker_cache), playId)
                self.speaker_cache = []
            self.speaker_is_playing = False
        elif topic == 'hermod/' + self.site + '/speaker/stop':
            ptl = len('hermod/' + self.site + '/speaker/stop') + 1
            playId = topic[ptl:]
            await self.stop_playing(playId)
        elif topic == 'hermod/' + self.site + '/speaker/volume':
            payload = {}
            try:
                payload = json.loads(payload_text)
                if ('volume' in payload):
                    self.set_volume(payload.get('volume'))
            except Exception as e:
                self.log(e)
            
        elif topic == 'hermod/rasa/ready':
            this_folder = os.path.dirname(os.path.realpath(__file__))
            wav_file = os.path.join(this_folder, 'loaded.wav')
            f = open(wav_file, "rb")
            wav = f.read();
            await self.client.publish('hermod/'+self.site+'/speaker/play',wav)
        elif topic == 'hermod/'+self.site+'/hotword/detected' or topic == 'hermod/'+self.site+'/dialog/continue':
            self.microphone_buffer = []
        elif topic == 'hermod/'+self.site+'/asr/timeout':
            ptl = len('hermod/' + self.site + '/speaker/play') + 1
            playId = topic[ptl:]
            # self.log('AUDIO SERVICE HEARD TIMEOUT')
            await self.restore_volume()
            await asyncio.sleep(0.01)
            await self.play_sound('off',self.site,playId)
            pass
           
    async def send_microphone_buffer(self):
       if hasattr(self,'client'):
            for a in self.microphone_buffer:
                topic = 'hermod/' + self.site + '/microphone/audio'
                await self.client.publish(
                    topic, payload=a, qos=0)
            self.microphone_buffer = []
        
    def save_microphone_buffer(self,frame):
        return  # disable buffer
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
                frames_per_buffer=self.FRAMES_PER_BUFFER, input_device_index=useIndex)
            speak_count = 0
            silence_count = 0
            speaking = False
            # longest slice for sampling given frames per buffer
            slice_size = 160
            silence_limit = 20
            if self.FRAMES_PER_BUFFER > 320:
                slice_size = 320
                silence_limit = 6
            elif self.FRAMES_PER_BUFFER > 480:
                slice_size = 480
                silence_limit = 3
            
            while True:
                await asyncio.sleep(0.01)
                frames = stream.read(self.FRAMES_PER_BUFFER, exception_on_overflow = False)
                if self.started:
                    buffer = np.frombuffer(frames, np.int16)
                    frame_slice = buffer[0:slice_size].tobytes()
                    is_speech = self.vad.is_speech(frame_slice, 16000)
                    if is_speech:
                        # prepend buffer on first speech
                        speaking = True
                        speak_count = speak_count + 1
                        silence_count = 0
                    else:
                        silence_count = silence_count + 1
                        if silence_count == silence_limit:
                            speaking = False
                            speak_count = 0
                        
                    if speaking:
                        if not self.speaker_is_playing:
                            topic = 'hermod/' + self.site + '/microphone/audio'
                            await self.client.publish(
                                topic, payload=frames, qos=0)
                        else:
                            pass
                    else:
                        self.save_microphone_buffer(frames)
                else:
                    self.silence_count=0
                    self.speak_count=0
            stream.stop_stream()
            stream.close()
      
    
    # async def play_buffer(self,buffer, **kwargs):
        # loop = asyncio.get_event_loop()
        # event = asyncio.Event()
        # idx = 0

        # def callback(outdata, frame_count, time_info, status):
            # nonlocal idx
            # remainder = len(buffer) - idx
            # if remainder == 0:
                # loop.call_soon_threadsafe(event.set)
                # raise sd.CallbackStop
            # valid_frames = frame_count if remainder >= frame_count else remainder
            # outdata[:valid_frames] = buffer[idx:idx + valid_frames]
            # outdata[valid_frames:] = 0
            # idx += valid_frames

        # stream = sd.OutputStream(callback=callback, dtype=buffer.dtype,
                                 # channels=buffer.shape[1], **kwargs)
        # with stream:
            # await event.wait()

    async def start_playing_url(self, url, playId):
        self.speaker_is_playing = True
        await self.client.publish("hermod/" + self.site + "/speaker/started", json.dumps({"id": playId}))
        sound_bytes = urlopen(url).read()
        await self.play_bytes(sound_bytes,playId)
        
                    
    async def start_playing(self, wav, playId ):
        self.speaker_is_playing = True
        await self.client.publish("hermod/" + self.site + "/speaker/started", json.dumps({"id": playId}))
        sound_bytes = bytes(wav)

        await self.play_bytes(sound_bytes,playId)
        
        
    async def play_sound(self,sound,site,playId):
        # self.log('req play sound')
        if sound and site:
            sounds = {
              "off":"turn_off.wav",
              "on":"turn_on.wav",
            }
            this_folder = os.path.dirname(os.path.realpath(__file__))
            file_name = sounds.get(sound,False)
            # self.log('req play sound '+file_name)
            if file_name:
                wav_file = os.path.join(this_folder, file_name)
                async with aiofiles.open(wav_file, mode='rb') as f:
                    audio_file = await f.read()
                    await self.play_bytes(audio_file,playId)
                    
                                   
    async def play_bytes(self,sound_bytes,playId):
        self.log('AUD PLAYBYTES '+str(len(sound_bytes)))
        # slow read
        # while f.tell() < f.__len__():
            # pos = f.tell()
            # audio = f.read(1024, always_2d=True, dtype='float32')
            # await self.play_buffer(audio ,samplerate = f.samplerate)
        sound_bytesio = io.BytesIO(sound_bytes)
        kind = filetype.guess(sound_bytes)
        extension = 'mp3' # default since google TTS sends without header? at least fails to identify as mp3
        try:
            extension = kind.extension
        except:
            pass
        song = AudioSegment.from_file(sound_bytesio, format=extension)
        executor = concurrent.futures.ThreadPoolExecutor(
            max_workers=1,
        )
        await self.loop.run_in_executor(executor,play,song)
        self.log('PLAYBYTES SONG done play')
        await self.client.publish("hermod/" + self.site +
                                 "/speaker/finished", json.dumps({"id": playId}))
        self.log('PLAYBYTES pub finsiehd')
        self.speaker_is_playing = False
        # OR asycio controllable (not working)
        # with io.BytesIO() as outfile:
            # song.export(outfile,format="wav")
            # with sf.SoundFile(outfile,'r+') as f:
                # audio = f.read(-1, always_2d=True, dtype='float32')
                # await self.play_buffer(outfile ,samplerate = f.samplerate)       
                # self.log('PLAYBYTES DONE PLAY')
        
                    
    async def stop_playing(self, playId):
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
                            "/speaker/finished", json.dumps({"id": playId}))       

    # PULSE BASED VOLUME FUNCTIONS SET MASTER VOLUME
    # TODO - extract output device detection and run on init so device name can be used here to replace pulse
    def set_volume(self,volume):
        #self.log('SET VOLUME '+str(volume))
        # get current volume
        FNULL = open(os.devnull, 'w')
        subprocess.call(["amixer", "-D", "pulse", "sset", "Master", str(volume)+"%"], stdout=FNULL, stderr=subprocess.STDOUT)
        self.current_volume = None

    async def mute_volume(self):
        self.current_volume = subprocess.getoutput("amixer sget Master | grep 'Right:' | awk -F'[][]' '{ print $2 }'")
        await self.client.subscribe('hermod/'+self.site+'/asr/stop')
        FNULL = open(os.devnull, 'w')
        subprocess.call(["amixer", "-D", "pulse", "sset", "Master", "5%"], stdout=FNULL, stderr=subprocess.STDOUT)
        
    async def restore_volume(self):
        if self.current_volume != None:
            restore_to = self.current_volume
            FNULL = open(os.devnull, 'w')
            subprocess.call(["amixer", "-D", "pulse", "sset", "Master", '{}'.format(restore_to)], stdout=FNULL, stderr=subprocess.STDOUT)
            self.current_volume = None
            await self.client.unsubscribe('hermod/'+self.site+'/asr/stop')
