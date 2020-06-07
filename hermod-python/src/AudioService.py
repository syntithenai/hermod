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
        # self.log('MIC constructor {}'.format(self.site))
        #self.thread_targets.append(self.send_audio_frames)
        self.also_run=[self.send_audio_frames]
        self.started = False
        # hermod/' + self.site + '/asr/start,hermod/' + self.site + '/asr/stop,
        self.subscribe_to = 'hermod/rasa/ready,hermod/' + self.site + '/asr/start,hermod/' + self.site + \
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
        
    async def on_message(self, msg):
        # self.log("MESSAGE")
        # self.log(len(self.microphone_buffer))
        # self.log(msg)
        #return
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
            self.log('SPEAKER   CACHE PLAYING')
            # limit length of direct audio, alt use url streaming for unlimited
            if len(self.speaker_cache) < 800:
                self.speaker_cache.append(msg.payload)
        elif topic.startswith('hermod/' + self.site + '/speaker/play'):
            self.log('SPEAKER PLAYING')
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
                #self.log(e)
            #self.log(payload)
            if payload.get('url',False):
                await self.start_playing_url(payload.get('url'), playId)
            
            elif payload.get('sound',False):
                await self.play_sound(payload.get('sound'),self.site)
            
            else:
                self.log('START PLAYING')
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
        elif topic == 'hermod/'+self.site+'/hotword/detected' or topic == 'hermod/'+self.site+'/dialog/continue':
            self.microphone_buffer = []
        elif topic == 'hermod/'+self.site+'/timeout':
            pass
           
    async def play_sound(self,sound,site):
        self.log('req play sound')
        if sound and site:
            sounds = {
              "off":"turn_off.wav",
              "on":"turn_on.wav",
            }
            this_folder = os.path.dirname(os.path.realpath(__file__))
            file_name = sounds.get(sound,False)
            self.log('req play sound '+file_name)
            if file_name:
                wav_file = os.path.join(this_folder, file_name)
                async with aiofiles.open(wav_file, mode='rb') as f:
                    audio_file = await f.read()
                    self.log('req play sound read file')
                    await self.play_bytes(audio_file)
                    #await self.client.publish('hermod/'+site+'/speaker/play',audio_file)
                    self.log('req play sound SeNT')
            
    async def send_microphone_buffer(self):
       if hasattr(self,'client'):
            # self.log('SEND MIC BUFFER {}'.format(len(self.microphone_buffer)))
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
        #return
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
            # self.log('MIC HAVE STREAM:')
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
            
            # self.log('MIC HAVE STREAM WHILE TRUE:')
            while True:
                #self.log('MIC HAVE STREAM UIN LOOP  ')
                #self.log('START LOOP send_audio_frames {} silence {} speech {} is speaking {}'.format(self.started, silence_count,speech_count,speaking))
                await asyncio.sleep(0.01)
                
                frames = stream.read(self.FRAMES_PER_BUFFER, exception_on_overflow = False)
                    
                if self.started:
                    #self.log('MIC HAVE STREAM UIN LOOP  IS STARTED')
                    buffer = np.frombuffer(frames, np.int16)
                    frame_slice = buffer[0:slice_size].tobytes()
                    # self.log("valid {}".format(webrtcvad.valid_rate_and_frame_length(16000,len(frame_slice))))
                    is_speech = self.vad.is_speech(frame_slice, 16000)
                    if is_speech:
                        # self.log('MIC HAVE STREAM UIN LOOP IS SPEECH')
                        # prepend buffer on first speech
                        # if speak_count == 0:
                            # await self.send_microphone_buffer()
                        speaking = True
                        speak_count = speak_count + 1
                        silence_count = 0
                    else:
                        #if speaking:
                            #self.log('MIC HAVE STREAM UIN LOOP  NOT IS SPEECH')
                        #asyncio.sleep(0.5)
                        silence_count = silence_count + 1
                        if silence_count == silence_limit:
                            self.log('MICROPHONE SILENCE TIMEOUT')
                            speaking = False
                            speak_count = 0
                        
                    if speaking:
                        if not self.speaker_is_playing:
                           #self.log('MIC SEND AUDIO PACKET')
                            topic = 'hermod/' + self.site + '/microphone/audio'
                            await self.client.publish(
                                topic, payload=frames, qos=0)
                        else:
                            pass
                            #self.log('MIC ban during speech')
                            
                    else:
                        #self.log('MIC HAVE STREAM SAVE AUDIO PACKET')
                        self.save_microphone_buffer(frames)
                else:
                    #self.log('MIC NOT STARTED')
                    self.silence_count=0
                    self.speak_count=0
            stream.stop_stream()
            stream.close()
      
    
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

    async def start_playing_url(self, url, playId):
        self.log('AUD start playing url')
        # self.force_stop_play = False;
        self.speaker_is_playing = True
        await self.client.publish("hermod/" + self.site + "/speaker/started", json.dumps({"id": playId}))
        #with sf.SoundFile(io.BytesIO(urlopen(url).read()),'r+') as f:
        sound_bytes = urlopen(url).read()
        await self.play_bytes(sound_bytes)
        await self.client.publish("hermod/" + self.site +
                                 "/speaker/finished", json.dumps({"id": playId}))
        self.speaker_is_playing = False
                                 
        self.log('AUD stop playing url')
                    
    async def start_playing(self, wav, playId = ''):
        self.log('AUD start playing')
        # self.force_stop_play = False;
        self.speaker_is_playing = True
        await self.client.publish("hermod/" + self.site + "/speaker/started", json.dumps({"id": playId}))
        sound_bytes = bytes(wav)

        await self.play_bytes(sound_bytes)
        
        await self.client.publish("hermod/" + self.site +
                                 "/speaker/finished", json.dumps({"id": playId}))
        #self.log('sent  p started')
        self.speaker_is_playing = False
        self.log('AUD stop playing')
        
  
    async def play_bytes(self,sound_bytes):
        #self.log('AUD PLAYBYTES '+str(len(sound_bytes)))
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
        #self.log('PLAYBYTES EXT'+extension)
        song = AudioSegment.from_file(sound_bytesio, format=extension)
        #self.log('PLAYBYTES SONG')
        # using pydub
        # play(song)
        # OR asycio
        executor = concurrent.futures.ThreadPoolExecutor(
            max_workers=1,
        )
        await self.loop.run_in_executor(executor,play,song)
        # OR asycio controllable (not working)
        # with io.BytesIO() as outfile:
            # song.export(outfile,format="wav")
            # with sf.SoundFile(outfile,'r+') as f:
                # audio = f.read(-1, always_2d=True, dtype='float32')
                # await self.play_buffer(outfile ,samplerate = f.samplerate)       
                # self.log('PLAYBYTES DONE PLAY')
        
                    
    async def stop_playing(self, playId):
        #self.log('stop playing')
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
        #self.log('MUTE VOLUME ')
        self.current_volume = subprocess.getoutput("amixer sget Master | grep 'Right:' | awk -F'[][]' '{ print $2 }'")
        await self.client.subscribe('hermod/'+self.site+'/asr/stop')
        FNULL = open(os.devnull, 'w')
        subprocess.call(["amixer", "-D", "pulse", "sset", "Master", "5%"], stdout=FNULL, stderr=subprocess.STDOUT)
        
    async def restore_volume(self):
        #self.log('RESTORE VOLUME {}'.format(self.current_volume))
        if self.current_volume != None:
            restore_to = self.current_volume
            # if not float(restore_to) > 0: 
                # restore_to = 0
            FNULL = open(os.devnull, 'w')
            subprocess.call(["amixer", "-D", "pulse", "sset", "Master", '{}'.format(restore_to)], stdout=FNULL, stderr=subprocess.STDOUT)
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



  
        # FFMPEG example of Blocking Mode Audio I/O https://people.csail.mit.edu/hubert/pyaudio/docs/

# """PyAudio Example: Play a wave file."""

# import pyaudio
# import wave
# import sys
# import subprocess

# CHUNK = 1024

# if len(sys.argv) < 2:
    # print("Plays an audio file.\n\nUsage: %s filename.wav" % sys.argv[0])
    # sys.exit(-1)

    # song = subprocess.Popen(["ffmpeg", "-i", sys.argv[1], "-loglevel", "panic", "-vn", "-f", "s16le", "pipe:1"],
                            # stdout=subprocess.PIPE)

    # # instantiate PyAudio (1)
    # p = pyaudio.PyAudio()

    # # open stream (2)
    # stream = p.open(format=pyaudio.paInt16,
                    # channels=2,         # use ffprobe to get this from the file beforehand
                    # rate=44100,         # use ffprobe to get this from the file beforehand
                    # output=True)

    # # read data
    # data = song.stdout.read(CHUNK)

    # # play stream (3)
    # while len(data) > 0:
        # stream.write(data)
        # data = song.stdout.read(CHUNK)

    # # stop stream (4)
    # stream.stop_stream()
    # stream.close()

    # # close PyAudio (5)
    # p.terminate()

# from subprocess import Popen, PIPE

# with open("test.avi", "rb") as infile:
    # p=Popen(["ffmpeg", "-i", "-", "-f", "matroska", "-vcodec", "mpeg4",
        # "-acodec", "aac", "-strict", "experimental", "-"],
           # stdin=infile, stdout=PIPE)
    # while True:
        # data = p.stdout.read(1024)
        # if len(data) == 0:
            # break
        # # do something with data...
        # print(data)
    # print p.wait() # should have finisted anyway
    
    # # lets save it!
# with open("%s_minute_playlist.mp3" % playlist_length, 'wb') as out_f:
    # playlist.export(out_f, format='mp3')
    

# import io

# data = open('verdi.mp3', 'rb').read()

# song = AudioSegment.from_file(io.BytesIO(data), format="mp3")
# play(song)
  
        
        # with sf.SoundFile(io.BytesIO(urlopen(url).read()),'r+') as f:
            # #from __future__ import absolute_import
            # kind = filetype.guess(f)
            # self.log(kind)
            
            # song = AudioSegment.from_file(f, format="mp3")
            # play(song)
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
            # audio = f.read(-1, always_2d=True, dtype='float32')
            # await self.play_buffer(audio ,samplerate = f.samplerate)
            
              
