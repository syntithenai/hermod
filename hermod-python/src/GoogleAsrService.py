
from __future__ import division
from google.cloud import speech
from google.cloud.speech import enums
from google.cloud.speech import types

import asyncio
#import re
import os
import numpy as np

#from datetime import datetime
from threading import Thread
import json
import time
#import io


from ThreadHandler import ThreadHandler
from MqttService import MqttService

from io_buffer import BytesLoop
import threading, collections, queue, os, os.path
#import pyaudio

import webrtcvad

class Transcoder(object):
    """
    Converts audio chunks to text
    """
    def __init__(self, encoding, rate, language, mqtt_client, site, last_dialog_id):
        self.buff = queue.Queue()
        self.encoding = encoding
        self.language = language
        self.rate = rate
        self.closed = True
        self.transcript = None
        self.error = None
        self.mqtt_client = mqtt_client
        self.site = site
        self.last_dialog_id = last_dialog_id

    def start(self):
        # print('TRANSCODER START ')
        """Start up streaming speech call"""
        threading.Thread(target=self.process).start()
        
    
    def response_loop(self, responses):
        """
        Pick up the final result of Speech to text conversion
        """
        # print('TRANSCODER RESPONSE LOOP')
        for response in responses:
            # print('TRANSCODER RESPONSE')
            # print([response.speech_event_type])
            # print([response])
            # is_end_utterance = False
            # if response.speech_event_type == 1:
                # print('GOOGLE END UTTERANCE')
                # is_end_utterance = True
                # #break
            if response.error:
                # print(response.error.message)
                self.error = response.error
                #break
            if not response.results:
                continue
            result = response.results[0]
            if not result.alternatives:
                continue
            transcript = result.alternatives[0].transcript
            if result.is_final:
                self.transcript = transcript
                print('GOT TEXT '+transcript)
                asyncio.run(self.mqtt_client.publish('hermod/'+self.site+'/asr/text',json.dumps({"id": self.last_dialog_id, 'text':self.transcript})))
                self.closed = True
            # end utterance without transcript
            # else:
                # if is_end_utterance:
                    # break

    def process(self):
        """
        Audio stream recognition and result parsing
        """
        #You can add speech contexts for better recognition
        cap_speech_context = types.SpeechContext(phrases=[""])
        client = speech.SpeechClient()
        config = types.RecognitionConfig(
            encoding=self.encoding,
            sample_rate_hertz=self.rate,
            language_code=self.language
            # speech_contexts=[cap_speech_context,],
            # model='command_and_search'
        )
        streaming_config = types.StreamingRecognitionConfig(
            config=config,
            interim_results=False,
            single_utterance=True)
        audio_generator = self.stream_generator()
        # print('TRANSCODER PROCESS')
        requests = (types.StreamingRecognizeRequest(audio_content=content)
                    for content in audio_generator)

        responses = client.streaming_recognize(streaming_config, requests)
        try:
            self.response_loop(responses)
            # print('TRANSCODER DONE LOOP')
        except Exception as e:
            print('TRANSCODER ERR')
            print(e)
            pass
            #self.start()

    def stream_generator(self):
        while not self.closed:
            chunk = self.buff.get()
            if chunk is None:
                return
            data = [chunk]
            while True:
                try:
                    chunk = self.buff.get(block=False)
                    if chunk is None:
                        return
                    data.append(chunk)
                except queue.Empty:
                    break
            yield b''.join(data)

    def write(self, data):
        """
        Writes data to the buffer
        """
        self.buff.put(data)



######################################
# This class listens for mqtt audio packets and publishes asr/text messages

# It integrates silence detection to slice up audio and detect the end of a spoken message
# To activate the service for a site send a message - hermod/<site>/asr/activate
# Once activated, the service will start listening for audio packets when you send - hermod/<site>/asr/start
# The service will continue to listen and emit hermod/<site>/asr/text messages every time the recognition engine can recognise some non empty text
# A hermod/<site>/asr/stop message will disable recognition 
# A hermod/<site>/asr/deactivate message will garbage collect any resources related to the site.

###############################################################
 

class GoogleAsrService(MqttService):
    #FORMAT = pyaudio.paInt16
    # Network/VAD rate-space
    RATE_PROCESS = 16000
    #CHANNELS = 1
    BLOCKS_PER_SECOND = 50           
 
    def __init__(
            self,
            config,
            loop
            ):
        super(GoogleAsrService, self).__init__(config,loop)
        
        self.config = config
        self.loop = loop
        self.subscribe_to='hermod/+/asr/activate,hermod/+/asr/deactivate,hermod/+/asr/start,hermod/+/asr/stop,hermod/+/hotword/detected'
        
        # Create a thread-safe buffer of audio data
        # self._buff = {} 
        self.transcoders = {}
        self.audio_stream = {} #BytesLoop()
        
        self.closed = {}
        self.started = {} #False
        self.active = {} #False
        self.empty_count = {}
        self.last_audio = {}
        self.audio_count = 0;
        self.non_speech = {}
        self.sample_rate = self.RATE_PROCESS
        self.block_size = int(self.RATE_PROCESS / float(self.BLOCKS_PER_SECOND))
        self.frame_duration_ms = 1000 * self.block_size // self.sample_rate
        self.vad = webrtcvad.Vad(config['services']['GoogleAsrService'].get('vad_sensitivity',1))
        self.no_packet_timeouts = {}
        self.total_time_timeouts = {}
        self.last_dialog_id = {}
        # # TFLITE model for ARM architecture
        # system,  release, version, machine, processor = os.uname()                
        # #self.log([system,  release, version, machine, processor])
        # if processor == 'armv7l': self.modelFile = 'output_graph.tflite'
        self.slice_size = 160
        if self.block_size > 320:
            self.slice_size = 320
        elif self.block_size > 480:
            self.slice_size = 480
            
    async def total_time_timeout(self,site,msg):     
        await asyncio.sleep(12)
        print('TOTAL TIMEOUT')
        if site in self.no_packet_timeouts:
            self.no_packet_timeouts[site].cancel()  
        self.transcoders[site].write(msg.payload)
        self.stop_transcoder(site)
        await asyncio.sleep(0.5)
        if not self.transcoders[site].transcript:
            await self.client.publish('hermod/'+site+'/asr/timeout',json.dumps({"id":self.last_dialog_id[site]}))
            await self.client.publish('hermod/'+site+'/dialog/end',json.dumps({"id": self.last_dialog_id[site]}))
        
            
    async def no_packet_timeout(self,site,msg):
        await asyncio.sleep(3.5)
        if site in self.total_time_timeouts:
            self.total_time_timeouts[site].cancel()  
        self.transcoders[site].write(msg.payload)
        self.stop_transcoder(site)
        await asyncio.sleep(0.5)
        if not self.transcoders[site].transcript:
            await self.client.publish('hermod/'+site+'/asr/timeout',json.dumps({"id":self.last_dialog_id[site]}))
            await self.client.publish('hermod/'+site+'/dialog/end',json.dumps({"id": self.last_dialog_id[site]}))
        
    def stop_transcoder(self,site): 
        if site in self.transcoders:
            # buffer = np.frombuffer(msg.payload, np.int16)
            # frame_slice = buffer.tobytes()
            # self.transcoders[site].write(frame_slice)
            self.transcoders[site].write(None)
            self.transcoders[site].closed = True
            self.transcoders[site].write(None)
            self.started[site] = False
            
    # async def got_transcript(self,site):
        # print("GOT TEXT "+self.transcoders[site].transcript)
        # self.no_packet_timeouts[site].cancel()
        # self.stop_transcoder(site)
        # await self.client.publish('hermod/'+site+'/asr/text',json.dumps({"id": self.last_dialog_id[site], 'text':self.transcoders[site].transcript}))
        # self.started[site] = False
        # self.transcoders[site].transcript = None
        
    async def on_message(self, msg):
        topic = "{}".format(msg.topic)
        #self.log("ASR MESSAGE {}".format(topic))
        parts = topic.split("/")
        site = parts[1]
        
        if topic == 'hermod/' +site+'/asr/activate':
            self.log('activate ASR '+site)
            #await self.activate(site)
        elif topic == 'hermod/' +site+'/asr/deactivate':
            #self.log('deactivate ASR '+site)
            self.audio_stream.pop(site, '')
            self.active[site] = False
            self.started[site] = False
        elif topic == 'hermod/' +site+'/asr/start':
            payload={}
            payload_text = msg.payload
            try:
                payload = json.loads(payload_text)
            except Exception as e:
                pass
            self.last_dialog_id[site] = payload.get('id','')
            
            
            self.audio_stream[site] = BytesLoop()
            self.active[site] = True
            # if not site in self.active and self.active[site]:
                # await self.activate(site)
            self.log('start ASR '+site)
            self.started[site] = True
            self.last_audio[site] =  time.time()
            self.audio_stream[site] = BytesLoop()
            # speech_contexts=[speech.types.SpeechContext(
            # phrases=['hi', 'good afternoon'],
            # )])
            self.transcoders[site] = Transcoder(
                encoding=enums.RecognitionConfig.AudioEncoding.LINEAR16,
                rate=16000,
                language=self.config['services']['GoogleAsrService']['language'],
                mqtt_client = self.client,
                site = site,
                last_dialog_id = self.last_dialog_id[site]
            )
            self.transcoders[site].start()
            await self.client.subscribe('hermod/'+site+'/microphone/audio')
            # timeout if no packets
            if site in self.no_packet_timeouts:
                self.no_packet_timeouts[site].cancel()            
            self.no_packet_timeouts[site] = self.loop.create_task(self.no_packet_timeout(site,msg))
            # total time since start
            if site in self.total_time_timeouts:
                self.total_time_timeouts[site].cancel()            
            self.total_time_timeouts[site] = self.loop.create_task(self.total_time_timeout(site,msg))
            
            
        elif topic == 'hermod/'+site+'/asr/stop':
            self.log('stop ASR '+site)
            # clear timeouts
            if site in self.no_packet_timeouts:
                self.no_packet_timeouts[site].cancel()            
            # total time since start
            if site in self.total_time_timeouts:
                self.total_time_timeouts[site].cancel()  
            #self.transcoders[site].closed = True
            self.stop_transcoder(site)
            self.started[site] = False
            await self.client.unsubscribe('hermod/'+site+'/microphone/audio')
            #self.client.publish('hermod/'+site+'/speaker/play',self.turn_off_wav)
            
        # elif topic == 'hermod/'+site+'/hotword/detected' :
            # self.log('clear buffer '+site)
            # if site in self.ring_buffer:
                # self.ring_buffer[site].clear()
            #self.client.publish('hermod/'+site+'/speaker/play',self.turn_off_wav)
        
        elif topic == 'hermod/'+site+'/microphone/audio'  :
            self.audio_count = self.audio_count + 1
            #self.last_audio[site] =  time.time()
            
            # print('CHECK VAD')
            # print(len(msg.payload))
            buffer = np.frombuffer(msg.payload, np.int16)
            frame_slice1 = self.vad.is_speech(buffer[0:480].tobytes(), self.sample_rate)
            frame_slice2 = self.vad.is_speech(buffer[480:960].tobytes(), self.sample_rate)
            #frame_slice3 = self.vad.is_speech(buffer[960:1440].tobytes(), self.sample_rate)
            # frame_slice4 = self.vad.is_speech(buffer[1440:1920].tobytes(), self.sample_rate)
            # or frame_slice3 or frame_slice4
            if not (frame_slice1 or frame_slice2 ):
                self.non_speech[site] = self.non_speech.get(site,0)
                self.non_speech[site] = self.non_speech[site] + 1
                # print('NON SPEECH')
                # print(self.non_speech[site])    
            else:
                self.non_speech[site] = 0
                #print('IS SPEECH')
            payload = {}
            # ignore until started
            #print('SPEECH mess st')
            if site in self.transcoders and self.started[site]:
                # print('SPEECH mess s1')
                if site in self.no_packet_timeouts:
                    self.no_packet_timeouts[site].cancel()
                
                self.no_packet_timeouts[site] = self.loop.create_task(self.no_packet_timeout(site,msg))
                # print('SPEECH mess task')
                # restrict empty packets to transcoder
                silence_cutoff = 100
                if self.non_speech[site] < silence_cutoff:
                    self.log('save audio message {} {} {}'.format(len(msg.payload),site,self.audio_count))
                    self.transcoders[site].closed = False
                    self.transcoders[site].write(msg.payload)
                    # payload_text = msg.payload
                    
                    # try:
                        # payload = json.loads(payload_text)
                    # except Exception as e:
                        # pass
                        # #self.log(e)
                    
                    if self.transcoders[site].error and self.transcoders[site].error.code == 11:
                        # print('SPEECH  err 11')
                        # easy because no text expected so can send bail out messages directly
                        self.no_packet_timeouts[site].cancel()
                        self.stop_transcoder(site)
                        self.started[site] = False
                        await self.client.publish('hermod/'+site+'/asr/timeout',json.dumps({"id":self.last_dialog_id[site]}))
                        await self.client.publish('hermod/'+site+'/dialog/end',json.dumps({"id": self.last_dialog_id[site]}))
                    
                    if self.transcoders[site].transcript:
                        self.stop_transcoder(site)
                elif self.non_speech[site] == silence_cutoff:
                    # print('exceEd non speech')
                    self.no_packet_timeouts[site].cancel()
                    self.transcoders[site].write(msg.payload)
                    self.stop_transcoder(site)
                    # await self.client.publish('hermod/'+site+'/asr/timeout',json.dumps({"id":self.last_dialog_id[site]}))
                    # await self.client.publish('hermod/'+site+'/dialog/end',json.dumps({"id": self.last_dialog_id[site]}))
                    #self.transcoders[site].closed = True
                    #self.transcoders[site].write(None)
                    # self.started[site] = False
                    # await self.client.publish('hermod/'+site+'/asr/timeout',json.dumps({"id": payload.get('id','no_id')}))
                    # await self.client.publish('hermod/'+site+'/dialog/end',json.dumps({"id": payload.get('id','no_id')}))
                # print('SPEECH mess done')
            # if len(text) > 0:
                # self.log("ASR TEXT 3{}".format(text))
                # # self.empty_count[site] = 0
                # await self.client.publish('hermod/'+site+'/asr/text',json.dumps({'text':text}))
            # else:
                # await self.client.publish('hermod/'+site+'/dialog/end',json.dumps({}))    
                
            #self._buff[site].put(msg.payload)
        
    # async def activate(self,site):
        # #if not self.active[site]:
            # self.audio_stream[site] = BytesLoop()
            # self.active[site] = True
            # self.started[site] = False
            # # self._buff[site] = queue.Queue()
            # #self.closed[site] = False
            # #await self.client.subscribe('hermod/'+site+'/microphone/audio')
    

            
    # async def deactivate(self,site):
        # #if self.active[site]:
            # #await self.client.unsubscribe('hermod/'+site+'/microphone/audio')
            
            # #self.closed[site] = True


 
 
 
    # async def run(self):
        # while True:
            # async with AuthenticatedMqttClient(self.config.get('mqtt_hostname','localhost'),self.config.get('mqtt_port',1883),self.config.get('mqtt_user',''),self.config.get('mqtt_password','')) as client:
                # self.client = client
                # if hasattr(self,'connect_hook'):
                    # await self.connect_hook()
                # for sub in self.subscribe_to.split(","):
                    # # self.log('subscribe to {}'.format(sub))
                    # await client.subscribe(sub)
                
                # async with client.unfiltered_messages() as messages:
                    # async for message in messages:
                        # await self.on_message(message) 

    # async def audio_processor(websocket, path):
        # """
        # Collects audio from the stream, writes it to buffer and return the output of Google speech to text
        # """
        # config = await websocket.recv()
        # if not isinstance(config, str):
            # print("ERROR, no config")
            # return
        # config = json.loads(config)
        # transcoder = Transcoder(
            # encoding=config["format"],
            # rate=config["rate"],
            # language=config["language"]
        # )
        # transcoder.start()
        # while True:
            # try:
                # data = await websocket.recv()
            # except websockets.ConnectionClosed:
                # print("Connection closed")
                # break
            # transcoder.write(data)
            # transcoder.closed = False
            # if transcoder.transcript:
                # print(transcoder.transcript)
                # await websocket.send(transcoder.transcript)
                # transcoder.transcript = None

    # start_server = websockets.serve(audio_processor, IP, PORT)
    # asyncio.get_event_loop().run_until_complete(start_server)
    # asyncio.get_event_loop().run_forever()


    

            
    # def dframe_generator(self,site):
        # self.log('FG')
        # while not self.closed.get(site,False):
            # self.log('FG not closed')
            # # Use a blocking get() to ensure there's at least one chunk of
            # # data, and stop iteration if the chunk is None, indicating the
            # # end of the audio stream.
            # chunk = self._buff[site].get()
            # if chunk is None:
                # return
            # yield chunk;
            # # data = [chunk]

            # # # Now consume whatever other data's still buffered.
            # # while True:
                # # # self.log('FG loop')
                # # try:
                    # # chunk = self._buff[site].get(block=False)
                    # # if chunk is None:
                        # # return
                    # # data.append(chunk)
                # # except queue.Empty:
                    # # break
            # # self.log('FG yield')
            # # yield b''.join(data)
    
    # # def read(self,site):
        # # a = None
        # # if site in self.audio_stream:
            # # a = self.audio_stream[site].read(self.block_size*2);
        # # else:
            # # self.log('read without activate')
        # # return a
        
    # # coroutine
    # def frame_generator(self,site):
        # """Generator that yields all audio frames."""
        # silence_count = 0;
        # while True:
            # if silence_count > 100:
                # self.log('no voice packets timeout  ddddd')
                # break
                
            # if site in self.audio_stream and self.audio_stream[site].has_bytes(self.block_size*2):
                # self.log('have audiuo rame')
                # silence_count = 0;
                # yield self.audio_stream[site].read(self.block_size*2)
            # else:
                # # hand off control to other frame generators without yielding a value
                # self.log('NO have audiuo rame')
                # silence_count = silence_count + 1;
                # time.sleep(0.1)
            
                # #await asyncio.sleep(0.0001)
            # #padding_ms=300
            
 
    # def startASR(self,site):
        # self.startASRVAD(site)
        
        
    # async def startASRVAD(self, site = ''):
        # # while True:
            # # self.log('startASRVAD ')
            # # await asyncio.sleep(1)
            # # self.log('midASRVAD ')
            # # await asyncio.sleep(1)
            # # self.log('endASRVAD ')
            # # i = 0
            # # for frame in self.frame_generator(site):
                # # if (i > 10):
                    # # self.closed[site] = True
                    # # break
                # # i = i + 1
                # # self.log(i)
                # # self.log(frame)
        
        # # self.log(site)
        # # self.log(self.started[site])
        # # self.empty_count[site] = 0;
        # # self.stream_contexts[site] = self.models[site].createStream()
        
        # # See http://g.co/cloud/speech/docs/languages
        # # for a list of supported languages.
        # language_code = 'en-US'  # a BCP-47 language tag

        # client = speech.SpeechClient()
        # config = types.RecognitionConfig(
            # encoding=enums.RecognitionConfig.AudioEncoding.LINEAR16,
            # sample_rate_hertz=16000,
            # language_code=language_code)
        # streaming_config = types.StreamingRecognitionConfig(
            # config=config,
            # single_utterance=True)
        # requests = (types.StreamingRecognizeRequest(audio_content=content)
            # for content in self.frame_generator(site))

        # responses = client.streaming_recognize(streaming_config, requests)
        # text = ''
        # for response in responses:
            # if not response.results:
                # break
            # self.log("ASR TEXT1 {}".format(response.results))
            # self.log("ASR TEXT2 {}".format(response))
            # res = response.results[0]
            # text = res.alternatives[0].transcript
        # if len(text) > 0:
            # self.log("ASR TEXT 3{}".format(text))
            # # self.empty_count[site] = 0
            # await self.client.publish('hermod/'+site+'/asr/text',json.dumps({'text':text}))
        # else:
            # await self.client.publish('hermod/'+site+'/dialog/end',json.dumps({}))
       
       
       
       
       
       
       
       
        # self.log('sent content '+text)
        # self.started[site] = False
                
        # with MicrophoneStream(RATE, CHUNK) as stream:
            # audio_generator = stream.generator()
            # requests = (types.StreamingRecognizeRequest(audio_content=content)
                        # for content in audio_generator)

            # responses = client.streaming_recognize(streaming_config, requests)

            # # Now, put the transcription responses to use.
            # listen_print_loop(responses)

        
        
        # while self.started[site] == True:
        # #while True and run_event and run_event.is_set(): 
            # #await asyncio.sleep(1)
           # # self.log('startASRVAD LOOP '+site)
            # #self.started[site] = False
           # # time.sleep(1)
            # # self.log(site)
            # # self.log(self.active)
            # # self.log(self.started)
            # # self.log(self.models)
            # # self.log(self.stream_contexts)
            # if (site in self.active and  site in self.started and site in self.models and site in self.stream_contexts and self.active[site] == True):
                # self.log('startASRVAD LOOP OK')
                # requests = (types.StreamingRecognizeRequest(audio_content=content)
                                            # for content in self.frame_generator(site))

                # responses = client.streaming_recognize(streaming_config, requests)
                # for response in responses:
                    # if not response.results:
                        # break
                    # text = response.results[0]
                # self.log("ASR TEXT {}".format(text))
                # self.empty_count[site] = 0
                # await self.client.publish('hermod/'+site+'/asr/text',json.dumps({'text':text}))
                # # self.log('sent content '+text)
                # self.started[site] = False
                    
                # async for frame in self.vad_collector(site):
                    # #await asyncio.sleep(0.001)
                    # # self.log('frame {} {}'.format(site,self.empty_count[site]))
                    # # self.log(self.started[site])
                    # if self.empty_count[site] > 8 and self.started[site]:
                        # # self.log('TIMEOUT EMPTY')
                        # await self.client.publish('hermod/'+site+'/dialog/end',json.dumps({}))
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
                                # self.models[site].feedAudioContent(self.stream_contexts[site], np.frombuffer(frame, np.int16))
                                # # self.log('fed content')
                            # except:
                                # self.log('error feeding content')
                                # pass
                            
                        # else:
                            # text = self.models[site].finishStream(self.stream_contexts[site])
                            # self.log('got text [{}]'.format(text))
                            # if len(text) > 0:
                                # # self.log('send content '+site)
                                # # self.log(self.client)
                                # # self.log('hermod/'+site+'/asr/text')
                                # # self.log(json.dumps({'text':text}))
                                # self.empty_count[site] = 0
                                # await self.client.publish('hermod/'+site+'/asr/text',json.dumps({'text':text}))
                                # # self.log('sent content '+text)
                                # self.started[site] = False
                                # break;
                            # else:
                                # # self.log('incc emtpy')
                                # self.empty_count[site] = self.empty_count[site]  + 1
                            
                            # # self.log('recreate stream')
                            # del self.stream_contexts[site]
                            # self.stream_contexts[site] = self.models[site].createStream()
                            # # self.log('recreated stream')
                        
                        
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
    
    # async def startASR(self, site):
        # # self.log('start asr' +site)
        # empty_count = {}
        # if os.path.isdir(self.model_path):
            # # self.log('start task '+site)
            # self.started[site] = True;
            # # #self.thread_handler.run(self.startASRVAD,kwargs=dict(site=site))
            # self.loop.run_in_executor(None,self.startASRVAD,site)
            # #await self.startASRVAD(site)
            # # #self.log('done loop')
        
            # # self.eventloop.create_task(self.startASRVAD(site))
            # # self.log('task started')
            # # # #self.eventloop = asyncio.get_event_loop()
            # # self.eventloop = asyncio.new_event_loop()
            # # asyncio.set_event_loop(self.eventloop)
            # # self.log('have loop')
            
            # #self.eventloop.create_task(self.waitASec(3,'sec'))
            # # self.log('added task')
            
            # # self.eventloop.create_task(self.waitASec(5,'moment'))
            # # self.log('added task')
            # # self.eventloop.run_forever()
            # # self.log('done loop')
            # # self.eventloop.close()
            # # self.log('loop closed')
            # # while True and run_event.is_set():
                # # time.sleep(0.001)
                # # try:
                    # # for site in self.active:
                        # # self.log('site '+site)
                        # # empty_count[site] = 0;
                        # # self.startASRVAD(site,empty_count)
                # # except Exception as e:
                    # # self.log(e)
        # else:
            # print('missing model files at '+self.model_path) 
    
  

   # async def vad_collector(self, site,padding_ms=280, ratio=0.75, frames=None):
        # """Generator that yields series of consecutive audio frames comprising each utterence, separated by yielding a single None.
            # Determines voice activity by ratio of frames in padding_ms. Uses a buffer to include padding_ms prior to being triggered.
            # Example: (frame, ..., frame, None, frame, ..., frame, None, ...)
                      # |---utterence---|        |---utterence---|
        # """
        # #if frames is None: frames = 
        # num_padding_frames = padding_ms // self.frame_duration_ms
        # self.ring_buffer[site] = collections.deque(maxlen=num_padding_frames)
        # triggered = False
        # self.last_audio[site] =  time.time()
        # #last_audio = time.time()           
        # async for frame in self.frame_generator(site):
            # now = time.time()
            # #self.log('VADLOOP')
            # # self.log(now - last_audio)
            # if (now -  self.last_audio[site]) > 10 and self.active[site] == True and self.started[site]:
                # self.log('ASR silence TIMEOUT')
                # await self.client.publish('hermod/'+site+'/asr/stop',json.dumps({}))
                # break;
                            
            # if len(frame) < 1:  # 640
                # yield None
                # return
            
            # is_speech = self.vad.is_speech(frame, self.sample_rate)
            # # self.log('is speech {}'.format(is_speech))
            # if not triggered:
                # # self.log('not triggered')
                # self.ring_buffer[site].append((frame, is_speech))
                # num_voiced = len([f for f, speech in self.ring_buffer[site] if speech])
                # if num_voiced > ratio * self.ring_buffer[site].maxlen:
                    # # self.log('push trigger')
                
                    # triggered = True
                    # for f, s in self.ring_buffer[site]:
                        # yield f
                    # self.ring_buffer[site].clear()

            # else:
                # # self.log(' triggered')
                # self.last_audio[site] = time.time()
                # yield frame
                # self.ring_buffer[site].append((frame, is_speech))
                # num_unvoiced = len([f for f, speech in self.ring_buffer[site] if not speech])
                # if num_unvoiced > ratio * self.ring_buffer[site].maxlen:
                    # # self.log(' untriggered')
                    # triggered = False
                    # yield None
                    # self.ring_buffer[site].clear()

