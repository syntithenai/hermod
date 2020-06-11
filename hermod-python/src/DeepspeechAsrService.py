import os
import struct
import sys
from datetime import datetime
from threading import Thread
import json
import time
import io

from socket import error as socket_error
import paho.mqtt.client as mqtt
import warnings
import soundfile
import json

#from ThreadHandler import ThreadHandler
from MqttService import MqttService

from io_buffer import BytesLoop
import threading, collections, queue, os, os.path
import deepspeech
import numpy as np
import pyaudio
import wave
import webrtcvad
from scipy import signal
import asyncio

######################################
# This class listens for mqtt audio packets and publishes asr/text messages

# It integrates silence detection to slice up audio and detect the end of a spoken message
# Based on the deepspeech examples repository python streaming example.
# To activate the service for a site send a message - hermod/<site>/asr/activate
# Once activated, the service will start listening for audio packets when you send - hermod/<site>/asr/start
# The service will continue to listen and emit hermod/<site>/asr/text messages every time the deepspeech engine can recognise some non empty text
# A hermod/<site>/asr/stop message will disable recognition while still leaving a loaded deepspeech transcription instance for the site so it can be reenabled instantly
# A hermod/<site>/asr/deactivate message will garbage collect any resources related to the site.

###############################################################
 

class DeepspeechAsrService(MqttService):
    RATE_PROCESS = 16000
    CHANNELS = 1
    BLOCKS_PER_SECOND = 50           
 
    def __init__(
            self,
            config,
            loop
            ):

        self.config = config
        self.loop = loop

        super(DeepspeechAsrService, self).__init__(config,loop)
        
        self.sample_rate = self.RATE_PROCESS
        self.block_size = int(self.RATE_PROCESS / float(self.BLOCKS_PER_SECOND))
        self.frame_duration_ms = 1000 * self.block_size // self.sample_rate
        self.vad = webrtcvad.Vad(2) #webrtcvad.Vad(config['services']['DeepspeechAsrService'].get('vad_sensitivity',1))
        self.model_path = config['services']['DeepspeechAsrService']['model_path']
        self.modelFile = 'deepspeech-0.7.0-models.pbmm'
        self.subscribe_to='hermod/+/asr/activate,hermod/+/asr/deactivate,hermod/+/asr/start,hermod/+/asr/stop,hermod/+/hotword/detected'
        
        # TFLITE model for ARM architecture
        system,  release, version, machine, processor = os.uname()                
        #self.log([system,  release, version, machine, processor])
        if processor == 'armv7l': self.modelFile = 'deepspeech-0.7.0-models.tflite'
        
        self.last_start_id = {}  # for passing dialog id when not given in message -  per site
        self.audio_stream = {} #BytesLoop()  buffer for passing mqtt -> deepspeech  -  per site
        # self.is_speaking = {}  # follow speaker messages to disable text processing when speaking -  per site
        self.started = {} #False  got started message for sessison -  per site
        self.active = {} #False  got active message for session -  per site
        self.empty_count = {}  # tally empty transcripts and bail after 3 empty -  per site
        self.stream_contexts = {}  # Deepspeech engine stream contexts - per site
        self.no_packet_timeouts = {}
        self.total_time_timeouts = {}
        # preload notification sounds
        # this_folder = os.path.dirname(os.path.realpath(__file__))
        # wav_file = os.path.join(this_folder, 'turn_off.wav')
        # f = open(wav_file, "rb")
        # self.turn_off_wav = f.read();
        modelPath = os.path.join(self.model_path, self.modelFile)
        scorerPath = os.path.join(self.model_path, 'deepspeech-0.7.0-models.scorer')
        self.models = deepspeech.Model(modelPath)
        self.models.enableExternalScorer(scorerPath)

        
    async def on_message(self, msg):
        topic = "{}".format(msg.topic)
        #self.log("ASR MESSAGE {}".format(topic))
        parts = topic.split("/")
        site = parts[1]

        if topic == 'hermod/' +site+'/asr/activate':
            self.log('activate ASR '+site)
            await self.activate(site)
        elif topic == 'hermod/' +site+'/asr/deactivate':
            self.log('deactivate ASR '+site)
            await self.deactivate(site)
        elif topic == 'hermod/' +site+'/asr/start':
            if not site in self.active and self.active[site]:
                await self.activate(site)
            # and not site in self.started:
            self.log('start ASR '+site)
            self.started[site] = True
            # self.is_speaking[site] = False
            payload = {}
            try:
                payload = json.loads(msg.payload)
            except Exception as e:
                pass
            self.last_start_id[site] = payload.get('id','')
            # timeout if no packets
            if site in self.no_packet_timeouts:
                self.no_packet_timeouts[site].cancel()            
            self.no_packet_timeouts[site] = self.loop.create_task(self.no_packet_timeout(site))
            # total time since start
            if site in self.total_time_timeouts:
                self.total_time_timeouts[site].cancel()            
            self.total_time_timeouts[site] = self.loop.create_task(self.total_time_timeout(site))
            
            # start asr processing in background
            self.loop.create_task(self.startASRVAD(site))
            #await self.startASR(site)
                
        elif topic == 'hermod/'+site+'/asr/stop':
            self.log('stop ASR '+site)
            self.started[site] = False
            # clear timeouts
            if site in self.no_packet_timeouts:
                self.no_packet_timeouts[site].cancel()            
            # total time since start
            if site in self.total_time_timeouts:
                self.total_time_timeouts[site].cancel()  
                
        elif topic == 'hermod/'+site+'/microphone/audio' :
            if site in self.started and self.started[site]: # and  site in self.is_speaking and not self.is_speaking[site]:
                self.log('save audio message') # {} {} '.format(len(msg.payload),site))
                self.audio_stream[site].write(msg.payload) 
                
        # elif topic == 'hermod/'+site+'/tts/say'  :
            # self.is_speaking[site] = True
            # self.log('ASR at start speaking '+site)
            
        # elif topic == 'hermod/'+site+'/tts/finished':
            # self.is_speaking[site] = False
            # self.log('ASR at stop speaking '+site)
            
        
    async def activate(self,site):
        if os.path.isdir(self.model_path):
            self.log('ACTIVATE DS ASR')
            # self.is_speaking[site] = False
            self.audio_stream[site] = BytesLoop()
            self.active[site] = True
            self.started[site] = False
            await self.client.subscribe('hermod/'+site+'/microphone/audio')
            # extra subscriptions in self.subscribe_to causes subscribe fail? so add these sub on activate
            # await self.client.subscribe('hermod/'+site+'/tts/say')
            # await self.client.subscribe('hermod/'+site+'/tts/finished')
            
            self.stream_contexts[site] = self.models.createStream()
        else:
            raise Exception("Could not load Deepspeech model file")    
   
    async def deactivate(self,site):
        await self.client.unsubscribe('hermod/'+site+'/microphone/audio')
        # await self.client.unsubscribe('hermod/'+site+'/tts/say')
        # await self.client.unsubscribe('hermod/'+site+'/tts/finished')
        self.audio_stream.pop(site, '')
        self.active[site] = False
        self.started[site] = False
            
      
    async def total_time_timeout(self,site):     
        await asyncio.sleep(12)
        print('TOTAL TIMEOUT tt')
        if site in self.no_packet_timeouts:
            self.no_packet_timeouts[site].cancel()  
        await self.finish_stream(site)
       
            
    async def no_packet_timeout(self,site):
        await asyncio.sleep(3)
        print('SILENCE TIMEOUT np')
        if site in self.total_time_timeouts:
            self.total_time_timeouts[site].cancel()  
        await self.finish_stream(site)
        
    async def timeout(self,site):
        await self.client.publish('hermod/'+site+'/asr/timeout',json.dumps({"id":self.last_start_id.get(site,'')}))
        await self.client.publish('hermod/'+site+'/dialog/end',json.dumps({"id":self.last_start_id.get(site,'')}))   
        self.started[site] = False
        
    
    async def finish_stream(self,site):
        text = self.stream_contexts[site].finishStream()
        self.log('got text [{}]'.format(text))
        if len(text) > 0:
            #self.log('send content '+site)
            # self.log(self.client)
            # self.log('hermod/'+site+'/asr/text')
            # self.log(json.dumps({'text':text}))
            self.empty_count[site] = 0
            await self.client.publish('hermod/'+site+'/asr/text',json.dumps({'text':text,"id":self.last_start_id.get(site,'')}))
            # self.log('sent content '+text)
            self.started[site] = False
            del self.stream_contexts[site]
        else:
            if self.empty_count[site] > 2:
                self.started[site] = False
                await self.timeout(site)
                
            self.log('incc emtpy '+str(self.empty_count[site]))
            self.empty_count[site] = self.empty_count[site]  + 1
            self.stream_contexts[site] = self.models.createStream()
        # if self.empty_count[site] > 5:
            # self.started[site] = False
            # await self.client.publish('hermod/'+site+'/asr/timeout',json.dumps({"id":self.last_start_id.get(site,'')}))
            
        # self.log('recreate stream')
        # if site in self.stream_contexts:
            # del self.stream_contexts[site]
        #self.stream_contexts[site] = self.models.createStream()
        # self.log('recreated stream')
    
    async def startASRVAD(self, site = ''):
        # self.log('startASRVAD ')
        # self.log(site)
        # self.log(self.started[site])
        if not site in self.active or not self.active[site]:
            await self.activate(site)
            # self.log('NOT ACTIVE CANNOT START ASR DS')
            # return None
            
        self.empty_count[site] = 0;
        self.stream_contexts[site] = self.models.createStream()
        while self.started[site] == True:
        #while True and run_event and run_event.is_set(): 
            #await asyncio.sleep(1)
           # self.log('startASRVAD LOOP '+site)
            #self.started[site] = False
           # time.sleep(1)
            # self.log(site)
            # self.log(self.active)
            # self.log(self.started)
            # self.log(self.models)
            # self.log(self.stream_contexts)
            # and site in self.models
            if (site in self.active and  site in self.started  and site in self.stream_contexts and self.active[site] == True):
                # self.log('startASRVAD LOOP OK')
                
                async for frame in self.vad_collector(site):
                    #await asyncio.sleep(0.001)
                    # self.log('frame {} {}'.format(site,self.empty_count[site]))
                    # self.log(self.started[site])
                    # if self.empty_count[site] > 3 and self.started[site]:
                        # self.log('TIMEOUT EMPTY')
                        # await self.client.publish('hermod/'+site+'/asr/timeout',json.dumps({"id":self.last_start_id.get(site,'')}))
                        # await self.client.publish('hermod/'+site+'/dialog/end',json.dumps({"id":self.last_start_id.get(site,'')}))
                        # self.started[site] = False
                        # break;
                    
                    if self.started[site] == True:
                     #   self.log('is started '+site)
                        # self.started[site] == False
                        if frame is not None:
                            # self.log('feed content '+site)
                            # self.log(self.models)
                            # self.log(self.stream_contexts)
                            try:
                                self.stream_contexts[site].feedAudioContent(np.frombuffer(frame, np.int16))
                                if site in self.no_packet_timeouts:
                                    self.no_packet_timeouts[site].cancel()
                                self.no_packet_timeouts[site] = self.loop.create_task(self.no_packet_timeout(site))
                                
                                # self.log('fed content')
                            except:
                                self.log('error feeding content')
                                pass
                            
                        else:
                            self.log('VAD NONE')
                            await self.finish_stream(site)
                        
                        
                        # # self.log('done started')
                        # #await asyncio.sleep(1)   
                        # # self.log('done sleep')
                    # self.log('done frame')
                # self.log('done frames')
            # self.log('done for')
       # self.log('done while')
                #del frames

    # async def waitASec(self,duration,label):
        # #self.log('wait a '+label)
        # #while True:
        # await asyncio.sleep(duration)
       # # self.log('waited a '+label)
    
    async def startASR(self, site):
        # self.log('start asr' +site)
        empty_count = {}
        if os.path.isdir(self.model_path):
            # self.log('start task '+site)
            self.started[site] = True;
            # #self.thread_handler.run(self.startASRVAD,kwargs=dict(site=site))
            await self.startASRVAD(site)
            # #self.log('done loop')
        
            # self.eventloop.create_task(self.startASRVAD(site))
            # self.log('task started')
            # # #self.eventloop = asyncio.get_event_loop()
            # self.eventloop = asyncio.new_event_loop()
            # asyncio.set_event_loop(self.eventloop)
            # self.log('have loop')
            
            #self.eventloop.create_task(self.waitASec(3,'sec'))
            # self.log('added task')
            
            # self.eventloop.create_task(self.waitASec(5,'moment'))
            # self.log('added task')
            # self.eventloop.run_forever()
            # self.log('done loop')
            # self.eventloop.close()
            # self.log('loop closed')
            # while True and run_event.is_set():
                # time.sleep(0.001)
                # try:
                    # for site in self.active:
                        # self.log('site '+site)
                        # empty_count[site] = 0;
                        # self.startASRVAD(site,empty_count)
                # except Exception as e:
                    # self.log(e)
        else:
            self.log('missing model files at '+self.model_path) 
    
  
        
    # coroutine
    async def frame_generator(self,site):
        """Generator that yields all audio frames."""
        silence_count = 0;
        while True and self.started[site]:
            # if silence_count > 200:
                # self.log('DEEPSPEECH no voice packets timeout  ')
                # await self.finish_stream(site)
                # break
                
            if site in self.audio_stream and self.audio_stream[site].has_bytes(self.block_size*2):
                silence_count = 0;
                yield self.audio_stream[site].read(self.block_size*2)
            else:
                # hand off control to other frame generators without yielding a value
                silence_count = silence_count + 1;
                await asyncio.sleep(0.01)
            
            
    async def vad_collector(self, site,padding_ms=400, ratio_start=0.55, ratio_stop=0.95, frames=None):  # original padding_ms=300
        """Generator that yields series of consecutive audio frames comprising each utterence, separated by yielding a single None.
            Determines voice activity by ratio of frames in padding_ms. Uses a buffer to include padding_ms prior to being triggered.
            Example: (frame, ..., frame, None, frame, ..., frame, None, ...)
                      |---utterence---|        |---utterence---|
        """
        #if frames is None: frames = 
        num_padding_frames = padding_ms // self.frame_duration_ms
        ring_buffer = collections.deque(maxlen=num_padding_frames)
        triggered = False
        #self.last_audio[site] =  time.time()
        #last_audio = time.time()           
        async for frame in self.frame_generator(site):
            #now = time.time()
            #self.log('VADLOOP')
            # self.log(now - last_audio)
            # if (now -  self.last_audio[site]) > 10 and self.active[site] == True and self.started[site]:
                # self.log('ASR silence TIMEOUT')
                # await self.client.publish('hermod/'+site+'/timeout',json.dumps({}))
                # await self.client.publish('hermod/'+site+'/dialog/end',json.dumps({"id":self.last_start_id.get(site,'')}))
                # break;
                            
            if len(frame) < 1:  # 640
                self.log('WARNING: SHORT FRAME')
                #pass
                # yield None
                # return
            else:
                is_speech = self.vad.is_speech(frame, self.sample_rate)
                # self.log('is speech {}'.format(is_speech))
                if not triggered:
                    # self.log('not triggered')
                    ring_buffer.append((frame, is_speech))
                    num_voiced = len([f for f, speech in ring_buffer if speech])
                    #self.log('TEST START {} {} '.format(num_voiced, ratio_start *  self.ring_buffer[site].maxlen))
                    if num_voiced > ratio_start * ring_buffer.maxlen:
                        #self.log('push trigger')
                        triggered = True
                        for f, s in ring_buffer:
                            yield f
                        ring_buffer.clear()

                else:
                    # self.log(' triggered')
                    #self.last_audio[site] = time.time()
                    yield frame
                    ring_buffer.append((frame, is_speech))
                    num_unvoiced = len([f for f, speech in ring_buffer if not speech])
                    #self.log('TEST STOP {} {} '.format(num_unvoiced, ratio_stop * ring_buffer.maxlen))
                    
                    if num_unvoiced > ratio_stop * ring_buffer.maxlen:
                        #self.log(' untriggered')
                        triggered = False
                        yield None
                        ring_buffer.clear()


