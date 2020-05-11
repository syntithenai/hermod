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

import numpy as np
import pyaudio
import wave
import webrtcvad
from scipy import signal
import asyncio

# import argparse
import base64
# import configparser
import websockets
import requests
import os


# ibm
import websocket
#from websocket._abnf import ABNF

CHUNK = 1024
FORMAT = pyaudio.paInt16
# Even if your default input is multi channel (like a webcam mic),
# it's really important to only record 1 channel, as the STT service
# does not do anything useful with stereo. You get a lot of "hmmm"
# back.
CHANNELS = 1
# Rate is important, nothing works without it. This is a pretty
# standard default. If you have an audio device that requires
# something different, change this.
RATE = 44100
RECORD_SECONDS = 10
FINALS = []


from dotenv import load_dotenv
load_dotenv()

######################################
# This class listens for mqtt audio packets and publishes asr/text messages

# It integrates silence detection to slice up audio and detect the end of a spoken message
# It is designed to be run as a thread by calling run(run_event) (implemented in MqttService)
#
# To activate the service for a site send a message - hermod/<site>/asr/activate
# Once activated, the service will start listening for audio packets when you send - hermod/<site>/asr/start
# The service will continue to listen and emit hermod/<site>/asr/text messages every time the deepspeech engine can recognise some non empty text
# A hermod/<site>/asr/stop message will disable recognition while still leaving a loaded deepspeech transcription instance for the site so it can be reenabled instantly
# A hermod/<site>/asr/deactivate message will garbage collect any resources related to the site.

###############################################################
 

class IbmAsrService(MqttService):
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

        super(IbmAsrService, self).__init__(config,loop)
        #self.thread_targets.append(self.startASR)    
       
        self.sample_rate = self.RATE_PROCESS
        self.block_size = int(self.RATE_PROCESS / float(self.BLOCKS_PER_SECOND))
        self.frame_duration_ms = 1000 * self.block_size // self.sample_rate
        self.vad = webrtcvad.Vad(config['services']['IbmAsrService'].get('vad_sensitivity',1))
        
        self.last_start_id = {}
        self.audio_stream = {} #BytesLoop()
        self.started = {} #False
        self.active = {} #False
        self.models = {}
        self.empty_count = {}
        self.stream_contexts = {}
        self.ring_buffer = {}
        self.last_audio = {}
        self.ibmlistening = {}
        self.connections = {}
                
        self.subscribe_to='hermod/+/asr/activate,hermod/+/asr/deactivate,hermod/+/asr/start,hermod/+/asr/stop,hermod/+/hotword/detected'
        self.audio_count = 0;
        this_folder = os.path.dirname(os.path.realpath(__file__))
        wav_file = os.path.join(this_folder, 'turn_off.wav')
        f = open(wav_file, "rb")
        self.turn_off_wav = f.read();
        # self.eventloop = asyncio.new_event_loop()
        # asyncio.set_event_loop(self.eventloop)
        self.log('START ibm ASR')
        self.log(this_folder)
            
        #self.startASR()


    def get_region_map(self):
        return {
            'us-east': 'gateway-wdc.watsonplatform.net',
            'us-south': 'stream.watsonplatform.net',
            'eu-gb': 'stream.watsonplatform.net',
            'eu-de': 'stream-fra.watsonplatform.net',
            'au-syd': 'gateway-syd.watsonplatform.net',
            'jp-tok': 'gateway-syd.watsonplatform.net',
        }


    def get_url(self):
        # if region is set, use lookups
        # https://console.bluemix.net/docs/services/speech-to-text/websockets.html#websockets
        if os.environ.get('IBM_SPEECH_TO_TEXT_REGION',False):
            host = self.get_region_map().get(os.environ.get('IBM_SPEECH_TO_TEXT_REGION'))
            return ("wss://{}/speech-to-text/api/v1/recognize"
               "?model=en-US_BroadbandModel").format(host)
        # if url from downloaded creds
        elif os.environ.get('IBM_SPEECH_TO_TEXT_URL',False):
           return os.environ.get('IBM_SPEECH_TO_TEXT_URL')
        # fallback to us-east
        else:
            return ("wss://{}/speech-to-text/api/v1/recognize"
               "?model=en-US_BroadbandModel").format('us-east')
        
    def get_auth(self):
        print('AUTH')
        print(os.environ.get('IBM_SPEECH_TO_TEXT_APIKEY'))
        apikey = str(os.environ.get('IBM_SPEECH_TO_TEXT_APIKEY'))
        return ("apikey", apikey)
        
    def get_headers(self):
        headers = {}
        userpass = ":".join(self.get_auth())
        headers["Authorization"] = "Basic " + base64.b64encode(
            userpass.encode()).decode()
        return headers

    def get_init_params(self):
        # Params to use for Watson API
        return {
            "word_confidence": True,
            "content_type": "audio/l16;rate=16000;channels=1",
            "action": "start",
            "interim_results": False,
            "speech_detector_sensitivity": 0.5,
            "background_audio_suppression": 0.5,
        }
            
    
        
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
            if site in self.connections:
                try:
                    await self.connections[site].close()
                except Exception:
                    pass
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
        # self.log('activate')
        self.audio_stream[site] = BytesLoop()
        self.active[site] = True
        self.started[site] = False
        await self.client.subscribe('hermod/'+site+'/microphone/audio')
              # # Load DeepSpeech model
            # self.log('START ibm ASR ACTIVATE '+self.model_path)
            
        #deepspeech-0.7.0-models.pbmm
        
            # modelPath = os.path.join(self.model_path, self.modelFile)
            # scorerPath = os.path.join(self.model_path, 'deepspeech-0.7.0-models.scorer')
            # lm = os.path.join(self.model_path, 'lm.binary')
            # trie = os.path.join(self.model_path, 'trie')
            
            
            # self.models[site] = deepspeech.Model(modelPath, 500)
            # if lm and trie:
                # self.models[site].enableDecoderWithLM(lm, trie, 0.75, 1.85)
            # self.models[site] = deepspeech.Model(modelPath)
            # self.models[site].enableExternalScorer(scorerPath)
            # self.stream_contexts[site] = self.models[site].createStream()
            
   
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
                
            if site in self.audio_stream and self.audio_stream[site].has_bytes(self.block_size*2) and site in self.ibmlistening and self.ibmlistening.get(site) == True:
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
        self.log('startASRVAD ')
        self.empty_count[site] = 0
        # clear stream buffer
        self.audio_stream[site] = BytesLoop()
        # NEW
        async with websockets.connect(self.get_url(), extra_headers=self.get_headers()) as conn:
                # Send request to watson and waits for the listening response
                self.connections[site] = conn
                send = await conn.send(json.dumps(self.get_init_params()))
                rec = await conn.recv()
                #print(rec)
                self.ibmlistening[site] = True
                asyncio.ensure_future(self.send_audio(conn,site))

                # Keeps receiving transcript until we have the final transcript
                while True:
                    try:
                        rec = await conn.recv()
                        parsed = json.loads(rec)
                        
                        #print(parsed)
                        #if 
                        #transcript = parsed["results"][0]["alternatives"][0]["transcript"]
                        #print(transcript)
                        print('=============================')
                        print(parsed)
                        print('=============================')
                        
                        if parsed.get("error",False):
                            self.log('ERROR FROM IBM')
                            self.log(parsed.get('error'))
                            try:
                                await conn.close()
                            except Exception:
                                pass
                            break
                            
                        if parsed.get('state',False) and parsed.get('state') == 'listening':
                            self.log('SET LISTENING '+site)
                            self.ibmlistening[site] = True;
                        
                        if "results" in parsed:
                            if len(parsed["results"]) > 0:
                                if "final" in parsed["results"][0]:
                                    if parsed["results"][0]["final"]:
                                        if len(parsed["results"][0]['alternatives']) > 0:
                                        
                                            text = str(parsed["results"][0]["alternatives"][0].get("transcript",""))
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
                                                await conn.close()
                                                return True
                                                
                                            else:
                                                # self.log('incc emtpy')
                                                self.empty_count[site] = self.empty_count[site]  + 1
                                                self.ibmlistening[site] = False
                                            
                                            #conn.close()
                                            #return False
                                            # pass
                    except KeyError:
                        await conn.close()
                        return False
                    except Exception as e:
                        await conn.close()
                        return False
    
    

    async def send_audio(self,ws,site):
        # Starts recording of microphone
        print("* READY *"+site)

        async for frame in self.vad_collector(site):
            self.log('frame {} {}'.format(site,self.empty_count[site]))
            if self.empty_count[site] > 8 and self.started[site]:
                self.log('TIMEOUT EMPTY')
                await self.client.publish('hermod/'+site+'/timeout',json.dumps({}))
                await self.client.publish('hermod/'+site+'/dialog/end',json.dumps({"id":self.last_start_id.get(site,'')}))
                self.started[site] = False
                break
            
            if self.started[site] == True  and self.ibmlistening.get(site,False):
                self.log('is started '+site)
                # self.started[site] == False
                if frame is not None:
                    # self.log('feed content '+site)
                    # self.log(self.models)
                    # self.log(self.stream_contexts)
                    try:
                        # print(".")
                        # data = stream.read(CHUNK)
                        await ws.send(frame) #np.frombuffer(frame, np.int16))
                        # self.stream_contexts[site].feedAudioContent(np.frombuffer(frame, np.int16))
                        self.log('fed content')
                    except Exception as e:
                        self.log('error feeding content')
                        self.log(e)
                        #break
                    
                else:
                    print('NOFRAME  -END BY VAD COLLECTOR')
                    #text = self.stream_contexts[site].finishStream()
                    try:
                        self.ibmlistening[site] = False
                        await ws.send(json.dumps({'action': 'stop'}))
                        
                    except Exception as e:
                        pass
                    #break

        # start = time.time()
        # while True:
            # try:
                # print(".")
                # data = stream.read(CHUNK)
                # await ws.send(data)
                # if time.time() - start > 10:    # Records for n seconds
                    # await ws.send(json.dumps({'action': 'stop'}))
                    # return False
            # except Exception as e:
                # print(e)
                # return False

        # # Stop the stream and terminate the recording
        # stream.stop_stream()
        # stream.close()
        # p.terminate()


                

                            


 # # OLD
        # self.empty_count[site] = 0;
        # while site in self.active and  site in self.started and self.started[site] == True and self.active[site] == True:
        
                # async for frame in self.vad_collector(site):
                    # #await asyncio.sleep(0.001)
                    # # self.log('frame {} {}'.format(site,self.empty_count[site]))
                    # # self.log(self.started[site])
                    # if self.empty_count[site] > 8 and self.started[site]:
                        # # self.log('TIMEOUT EMPTY')
                        # await self.client.publish('hermod/'+site+'/timeout',json.dumps({}))
                        # await self.client.publish('hermod/'+site+'/dialog/end',json.dumps({"id":self.last_start_id.get(site,'')}))
                        # self.started[site] = False
                        # break;
                    
                    # if self.started[site] == True:
                     # #   self.log('is started '+site)
                        # # self.started[site] == False
                        # if frame is not None:
                            # # self.log('feed content '+site)
                            # # self.log(self.models)
                            # # self.log(self.stream_contexts)
                            # try:
                                # print(".")
                                # data = stream.read(CHUNK)
                                # await ws.send(data)
                                # # self.stream_contexts[site].feedAudioContent(np.frombuffer(frame, np.int16))
                                # self.log('fed content')
                            # except:
                                # self.log('error feeding content')
                                # pass
                            
                        # else:
                            # #text = self.stream_contexts[site].finishStream()
                            # await ws.send(json.dumps({'action': 'stop'}))

                            
                            # # # self.log('recreate stream')
                            # # del self.stream_contexts[site]
                            # # self.stream_contexts[site] = self.models[site].createStream()
                            # # # self.log('recreated stream')
    



    

# # Starts the application loop
# loop = asyncio.get_event_loop()
# loop.run_until_complete(speech_to_text())
# loop.close()

    
    
    
    
    
