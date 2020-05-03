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

from ThreadHandler import ThreadHandler
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
# It is designed to be run as a thread by calling run(run_event) (implemented in MqttService)
# Based on the deepspeech examples repository python streaming example.
# To activate the service for a site send a message - hermod/<site>/asr/activate
# Once activated, the service will start listening for audio packets when you send - hermod/<site>/asr/start
# The service will continue to listen and emit hermod/<site>/asr/text messages every time the deepspeech engine can recognise some non empty text
# A hermod/<site>/asr/stop message will disable recognition while still leaving a loaded deepspeech transcription instance for the site so it can be reenabled instantly
# A hermod/<site>/asr/deactivate message will garbage collect any resources related to the site.

###############################################################
 

class DeepspeechAsrService(MqttService):
    FORMAT = pyaudio.paInt16
    # Network/VAD rate-space
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
        #self.thread_targets.append(self.startASR)    
       
        self.sample_rate = self.RATE_PROCESS
        self.block_size = int(self.RATE_PROCESS / float(self.BLOCKS_PER_SECOND))
        self.frame_duration_ms = 1000 * self.block_size // self.sample_rate
        self.vad = webrtcvad.Vad(config['services']['DeepspeechAsrService'].get('vad_sensitivity',0))
        self.modelFile = 'output_graph.pbmm'
        
        # TFLITE model for ARM architecture
        system,  release, version, machine, processor = os.uname()                
        #self.log([system,  release, version, machine, processor])
        if processor == 'armv7l': self.modelFile = 'output_graph.tflite'
        
        self.last_start_id = {}
        self.audio_stream = {} #BytesLoop()
        self.started = {} #False
        self.active = {} #False
        self.models = {}
        self.empty_count = {}
        self.stream_contexts = {}
        self.ring_buffer = {}
        self.last_audio = {}
        self.model_path = config['services']['DeepspeechAsrService']['model_path']
        self.subscribe_to='hermod/+/asr/activate,hermod/+/asr/deactivate,hermod/+/asr/start,hermod/+/asr/stop,hermod/+/hotword/detected'
        self.audio_count = 0;
        this_folder = os.path.dirname(os.path.realpath(__file__))
        wav_file = os.path.join(this_folder, 'turn_off.wav')
        f = open(wav_file, "rb")
        self.turn_off_wav = f.read();
        # self.eventloop = asyncio.new_event_loop()
        # asyncio.set_event_loop(self.eventloop)
        self.log('START DS ASR')
        self.log(this_folder)
            
        #self.startASR()
        
    async def on_message(self, msg):
        topic = "{}".format(msg.topic)
        #self.log("ASR MESSAGE {}".format(topic))
        parts = topic.split("/")
        site = parts[1]
        activateTopic = 'hermod/' +site+'/asr/activate'
        deactivateTopic = 'hermod/' +site+'/asr/deactivate'
        startTopic = 'hermod/' +site+'/asr/start'
        stopTopic = 'hermod/'+site+'/asr/stop'
        audioTopic = 'hermod/'+site+'/microphone/audio'       
        hotwordDetectedTopic = 'hermod/'+site+'/hotword/detected' 
        if topic == activateTopic:
            self.log('activate ASR '+site)
            await self.activate(site)
        elif topic == deactivateTopic:
            self.log('deactivate ASR '+site)
            await self.deactivate(site)
        elif topic == startTopic:
            self.log('start ASR '+site)
            if site in self.active: # and not site in self.started:
                self.log('start ASR active '+site)
                self.started[site] = True
                self.last_audio[site] =  time.time()
                payload = {}
                try:
                    payload = json.loads(msg.payload)
                except Exception as e:
                    self.log(e)
                self.last_start_id[site] = payload.get('id','')
                self.loop.create_task(self.startASRVAD(site))
                #await self.startASR(site)
        elif topic == stopTopic:
            self.log('stop ASR '+site)
            self.started[site] = False
            #self.client.publish('hermod/'+site+'/speaker/play',self.turn_off_wav)
            
        elif topic == hotwordDetectedTopic:
            self.log('clear buffer '+site)
            if site in self.ring_buffer:
                self.ring_buffer[site].clear()
            #self.client.publish('hermod/'+site+'/speaker/play',self.turn_off_wav)
        
        elif topic == audioTopic :
            self.audio_count = self.audio_count + 1
            #self.log('save audio message {} {} {}'.format(len(msg.payload),site,self.audio_count))
            self.audio_stream[site].write(msg.payload) 
        
    async def activate(self,site):
        self.log('activate')
        #if not self.active[site]:
            self.audio_stream[site] = BytesLoop()
            self.active[site] = True
            self.started[site] = False
            await self.client.subscribe('hermod/'+site+'/microphone/audio')
              # Load DeepSpeech model
            self.log('START DS ASR ACTIVATE '+self.model_path)
            if os.path.isdir(self.model_path):
                self.log('START DS ASR')
                modelPath = os.path.join(self.model_path, self.modelFile)
                lm = os.path.join(self.model_path, 'lm.binary')
                trie = os.path.join(self.model_path, 'trie')

                self.models[site] = deepspeech.Model(modelPath, 500)
                if lm and trie:
                    self.models[site].enableDecoderWithLM(lm, trie, 0.75, 1.85)
            
                self.stream_contexts[site] = self.models[site].createStream()
            
   
    async def deactivate(self,site):
        #if self.active[site]:
            await self.client.unsubscribe('hermod/'+site+'/microphone/audio')
            self.audio_stream.pop(site, '')
            self.active[site] = False
            self.started[site] = False
            
    # def read(self,site):
        # a = None
        # if site in self.audio_stream:
            # a = self.audio_stream[site].read(self.block_size*2);
        # else:
            # self.log('read without activate')
        # return a
        
    # coroutine
    async def frame_generator(self,site):
        """Generator that yields all audio frames."""
        silence_count = 0;
        while True:
            
            if silence_count > 1000:
                #self.log('no voice packets timeout  ')
                break
                
            if site in self.audio_stream and self.audio_stream[site].has_bytes(self.block_size*2):
                #self.log('have audiuo rame')
                silence_count = 0;
                yield self.audio_stream[site].read(self.block_size*2)
            else:
                # hand off control to other frame generators without yielding a value
                #self.log('NO have audiuo rame')
                silence_count = silence_count + 1;
                await asyncio.sleep(0.0001)
            #padding_ms=300
            
    async def vad_collector(self, site,padding_ms=280, ratio=0.75, frames=None):
        """Generator that yields series of consecutive audio frames comprising each utterence, separated by yielding a single None.
            Determines voice activity by ratio of frames in padding_ms. Uses a buffer to include padding_ms prior to being triggered.
            Example: (frame, ..., frame, None, frame, ..., frame, None, ...)
                      |---utterence---|        |---utterence---|
        """
        #if frames is None: frames = 
        num_padding_frames = padding_ms // self.frame_duration_ms
        self.ring_buffer[site] = collections.deque(maxlen=num_padding_frames)
        triggered = False
        self.last_audio[site] =  time.time()
        #last_audio = time.time()           
        async for frame in self.frame_generator(site):
            now = time.time()
            #self.log('VADLOOP')
            # self.log(now - last_audio)
            if (now -  self.last_audio[site]) > 10 and self.active[site] == True and self.started[site]:
                self.log('ASR silence TIMEOUT')
                await self.client.publish('hermod/'+site+'/timeout',json.dumps({}))
                await self.client.publish('hermod/'+site+'/dialog/end',json.dumps({"id":self.last_start_id.get(site,'')}))
                break;
                            
            if len(frame) < 1:  # 640
                yield None
                return
            
            is_speech = self.vad.is_speech(frame, self.sample_rate)
            # self.log('is speech {}'.format(is_speech))
            if not triggered:
                # self.log('not triggered')
                self.ring_buffer[site].append((frame, is_speech))
                num_voiced = len([f for f, speech in self.ring_buffer[site] if speech])
                if num_voiced > ratio * self.ring_buffer[site].maxlen:
                    # self.log('push trigger')
                
                    triggered = True
                    for f, s in self.ring_buffer[site]:
                        yield f
                    self.ring_buffer[site].clear()

            else:
                # self.log(' triggered')
                self.last_audio[site] = time.time()
                yield frame
                self.ring_buffer[site].append((frame, is_speech))
                num_unvoiced = len([f for f, speech in self.ring_buffer[site] if not speech])
                if num_unvoiced > ratio * self.ring_buffer[site].maxlen:
                    # self.log(' untriggered')
                    triggered = False
                    yield None
                    self.ring_buffer[site].clear()

    
    async def startASRVAD(self, site = ''):
        # self.log('startASRVAD ')
        # self.log(site)
        # self.log(self.started[site])
        self.empty_count[site] = 0;
        self.stream_contexts[site] = self.models[site].createStream()
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
            if (site in self.active and  site in self.started and site in self.models and site in self.stream_contexts and self.active[site] == True):
                # self.log('startASRVAD LOOP OK')
                
                async for frame in self.vad_collector(site):
                    #await asyncio.sleep(0.001)
                    # self.log('frame {} {}'.format(site,self.empty_count[site]))
                    # self.log(self.started[site])
                    if self.empty_count[site] > 8 and self.started[site]:
                        # self.log('TIMEOUT EMPTY')
                        await self.client.publish('hermod/'+site+'/timeout',json.dumps({}))
                        await self.client.publish('hermod/'+site+'/dialog/end',json.dumps({"id":self.last_start_id.get(site,'')}))
                        self.started[site] = False
                        break;
                    
                    if self.started[site] == True:
                     #   self.log('is started '+site)
                        # self.started[site] == False
                        if frame is not None:
                            # self.log('feed content '+site)
                            # self.log(self.models)
                            # self.log(self.stream_contexts)
                            try:
                                self.models[site].feedAudioContent(self.stream_contexts[site], np.frombuffer(frame, np.int16))
                                # self.log('fed content')
                            except:
                                self.log('error feeding content')
                                pass
                            
                        else:
                            text = self.models[site].finishStream(self.stream_contexts[site])
                            self.log('got text [{}]'.format(text))
                            if len(text) > 0:
                                # self.log('send content '+site)
                                # self.log(self.client)
                                # self.log('hermod/'+site+'/asr/text')
                                # self.log(json.dumps({'text':text}))
                                self.empty_count[site] = 0
                                await self.client.publish('hermod/'+site+'/asr/text',json.dumps({'text':text,"id":self.last_start_id.get(site,'')}))
                                # self.log('sent content '+text)
                                self.started[site] = False
                                break;
                            else:
                                # self.log('incc emtpy')
                                self.empty_count[site] = self.empty_count[site]  + 1
                            
                            # self.log('recreate stream')
                            del self.stream_contexts[site]
                            self.stream_contexts[site] = self.models[site].createStream()
                            # self.log('recreated stream')
                        
                        
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
        self.log('start asr' +site)
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
    
  


