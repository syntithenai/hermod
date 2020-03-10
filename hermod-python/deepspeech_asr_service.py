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
#import pyaudio
import soundfile
import json

from thread_handler import ThreadHandler
from mqtt_service import MqttService

from io_buffer import BytesLoop
import threading, collections, queue, os, os.path
import deepspeech
import numpy as np
import pyaudio
import wave
import webrtcvad
from scipy import signal



class deepspeech_asr_service(MqttService):
    FORMAT = pyaudio.paInt16
    # Network/VAD rate-space
    RATE_PROCESS = 16000
    CHANNELS = 1
    BLOCKS_PER_SECOND = 50           
 
    
 
    def __init__(
            self,
            config
            ):

        self.config = config

        super(deepspeech_asr_service, self).__init__(config['mqtt_hostname'],config['mqtt_port'],config['site'])
        self.thread_targets.append(self.startASR)    
       
        self.sample_rate = self.RATE_PROCESS
        self.block_size = int(self.RATE_PROCESS / float(self.BLOCKS_PER_SECOND))
        self.frame_duration_ms = 1000 * self.block_size // self.sample_rate
        self.vad = webrtcvad.Vad(config.get('vad_sensitivity',1))
        self.modelFile = 'output_graph.pbmm'
        
        # TODO fix the following check, see porcupine utility class for processor interpretation.
        # print('uname')
        system,  release, version, machine, processor = os.uname()                
        # print([system,machine,processor])
        if processor == 'arm7': self.modelFile = 'output_graph.tflite'
        
        
        self.audio_stream = {} #BytesLoop()
        self.started = {} #False
        self.active = {} #False
        self.models = {}
        self.stream_contexts = {}
        
        #self.site = config['site']
        self.model_path = config['services']['deepspeech_asr_service']['model_path']
        self.subscribe_to='hermod/+/asr/activate,hermod/+/asr/deactivate,hermod/+/asr/start,hermod/+/asr/stop'
    

    def on_message(self, client, userdata, msg):
        topic = "{}".format(msg.topic)
       # self.log("MESSAGE {}".format(topic))
        parts = topic.split("/")
        site = parts[1]
        activateTopic = 'hermod/' +site+'/asr/activate'
        deactivateTopic = 'hermod/' +site+'/asr/deactivate'
        startTopic = 'hermod/' +site+'/asr/start'
        stopTopic = 'hermod/'+site+'/asr/stop'
        audioTopic = 'hermod/'+site+'/microphone/audio'
        # self.log(topic)
        # self.log(activateTopic)
        # self.log(topic == activateTopic)
        if topic == activateTopic:
            #self.log('activate t')
            self.activate(site)
        elif topic == deactivateTopic:
            self.deactivate(site)
        elif topic == startTopic:
            self.started[site] = True
        elif topic == stopTopic:
            self.started[site] = False
        elif topic == audioTopic :
            #print(msg.payload)
            #self.buffer_queue.put(msg.payload)
            self.audio_stream[site].write(msg.payload) ;
            #self.log('write {} {} {}'.format(self.block_size,self.audio_stream.length(),len(msg.payload)))
        # sys.stdout.flush()

    def activate(self,site):
        #self.log('activate')
        self.audio_stream[site] = BytesLoop()
        self.active[site] = True
        self.started[site] = False
        self.client.subscribe('hermod/'+site+'/microphone/audio')
          # Load DeepSpeech model
        #self.log('activate1')
        if os.path.isdir(self.model_path):
            modelPath = os.path.join(self.model_path, self.modelFile)
            lm = os.path.join(self.model_path, 'lm.binary')
            trie = os.path.join(self.model_path, 'trie')

            #self.log('Initializing model...' + modelPath)
            self.models[site] = deepspeech.Model(modelPath, 500)
            if lm and trie:
                self.models[site].enableDecoderWithLM(lm, trie, 0.75, 1.85)
            #self.log('asr get streawm')
        
            self.stream_contexts[site] = self.models[site].createStream()
            #self.log('asr created streawm')
        
   
    def deactivate(self,site):
        self.client.unsubscribe('hermod/'+site+'/microphone/audio')
        self.audio_stream.pop(site, '')
        self.active[site] = False
        self.started[site] = False
        

    def read(self,site):
        """Return a block of audio data, blocking if necessary."""  
        a = self.audio_stream[site].read(self.block_size*2);
        # if (len(a) > 0):
            # self.log('read data ask {} got {} from {}'.format(self.block_size,len(a),self.audio_stream.length()))
        return a
        # *2
        #print('read {} {} {}'.format(self.block_size,self.audio_stream.hasBytes(self.block_size),self.audio_stream.length()))
        
        # if (self.started == True and self.audio_stream.hasBytes(self.block_size)): 
            # print('read {}'.format(self.block_size))
            # pcm = self.audio_stream.read(self.block_size)
            # print(pcm)
            # sys.stdout.flush()
            # #pcm = struct.unpack_from("h" * self.block_size, pcm)
            # return pcm    
        # else: 
           # return None  
        #return self.buffer_queue.get()       

    def frame_generator(self,site):
        """Generator that yields all audio frames."""
        while True:
            yield self.read(site)
            
    def vad_collector(self, site,padding_ms=300, ratio=0.75, frames=None):
        """Generator that yields series of consecutive audio frames comprising each utterence, separated by yielding a single None.
            Determines voice activity by ratio of frames in padding_ms. Uses a buffer to include padding_ms prior to being triggered.
            Example: (frame, ..., frame, None, frame, ..., frame, None, ...)
                      |---utterence---|        |---utterence---|
        """
        if frames is None: frames = self.frame_generator(site)
        num_padding_frames = padding_ms // self.frame_duration_ms
        ring_buffer = collections.deque(maxlen=num_padding_frames)
        triggered = False

        for frame in frames:
            if len(frame) < 640:
                yield None
                return
            
            is_speech = self.vad.is_speech(frame, self.sample_rate)
            if not triggered:
                ring_buffer.append((frame, is_speech))
                num_voiced = len([f for f, speech in ring_buffer if speech])
                if num_voiced > ratio * ring_buffer.maxlen:
                    triggered = True
                    for f, s in ring_buffer:
                        yield f
                    ring_buffer.clear()

            else:
                yield frame
                ring_buffer.append((frame, is_speech))
                num_unvoiced = len([f for f, speech in ring_buffer if not speech])
                if num_unvoiced > ratio * ring_buffer.maxlen:
                    triggered = False
                    yield None
                    ring_buffer.clear()



    def startASR(self, run_event):
       
        # Load DeepSpeech model
        if os.path.isdir(self.model_path):
            # modelPath = os.path.join(self.model_path, self.modelFile)
            # lm = os.path.join(self.model_path, 'lm.binary')
            # trie = os.path.join(self.model_path, 'trie')

         # #   self.log('Initializing model...' + modelPath)
            # model = deepspeech.Model(modelPath, 500)
            # if lm and trie:
                # model.enableDecoderWithLM(lm, trie, 0.75, 1.85)
           # # self.log('asr get streawm')
        
            # stream_context = model.createStream()
           # self.log('asr stream ready')
            # self.log(stream_context)
            while True and run_event.is_set():
                time.sleep(2)
                # self.log(self.active)
                for site in self.active:
                    # self.log('site')
                    # self.log(site)
                    if (site in self.models and site in self.stream_contexts and self.active[site] == True and self.started[site] == True):
                        #self.log('site start')
                    
                        frames = self.vad_collector(site)

                        for frame in frames:
                            #if (self.started):
                            if frame is not None:
                                # self.log("streaming frame")
                                self.models[site].feedAudioContent(self.stream_contexts[site], np.frombuffer(frame, np.int16))
                            else:
                                text = self.models[site].finishStream(self.stream_contexts[site])
                                # self.log("Recognized: %s" % text)
                                if (len(text) > 0):
                                    self.client.publish('hermod/'+site+'/asr/text',json.dumps({'text':text}))
                                self.stream_context[site] = self.models[site].createStream()
                            time.sleep(0.01)
                   
                   
               # frame = self.read()
               # self.log('fram')
                # vad detect call end utterance
                # if frame is not None:
                    # self.log("streaming frame")
                    # model.feedAudioContent(stream_context, np.frombuffer(frame, np.int16))
                # else:
                    # logging.debug("end utterence")
                    # text = model.finishStream(stream_context)
                    # print("Recognized: %s" % text)
                    # stream_context = model.createStream()
                # time.sleep(0.1)
        else:
            print('missing model files at '+self.model_path) 
    
    
    # def startMain(self, run_event):
        # """
         # Creates an input audio stream, initializes wake word detection (Porcupine) object, and monitors the audio
         # stream for occurrences of the wake word(s). It prints the time of detection for each occurrence and index of
         # wake word.
         # """
        # # ARGS = {
          # # vad_aggressiveness: 3,
          # # lm_alpha: 0.75,
          # # lb_beta: 1.85,
          # # beam_width: 500,
          # # rate: 16000,
          # # model:'none' 
        # # }
        # modelFile = 'output_graph.pb'
        
        # print('uname')
        # system,  release, version, machine, processor = os.uname()                
        # print([system,machine,processor])
        # if processor == 'arm7': modelFile = 'output_graph.tflite'
        
        # # Load DeepSpeech model
        # if os.path.isdir(self.model_path):
            # modelPath = os.path.join(self.model_path, modelFile)
            # lm = os.path.join(self.model_path, 'lm.binary')
            # trie = os.path.join(self.model_path, 'trie')

            # print('Initializing model...')
            # logging.info("ARGS.model: %s", modelPath)
            # model = deepspeech.Model(modelPath, 500)
            # if lm and trie:
                # logging.info("ARGS.lm: %s", lm)
                # logging.info("ARGS.trie: %s", trie)
                # model.enableDecoderWithLM(lm, trie, 0.75, 1.85)

            # stream_context = model.createStream()
            
            # while True and run_event.is_set():
                    
                # # Stream from microphone to DeepSpeech using VAD
                
                # frames = self.vad_collector()

                # for frame in frames:
                    # if frame is not None:
                        # logging.debug("streaming frame")
                        # model.feedAudioContent(stream_context, np.frombuffer(frame, np.int16))
                    # else:
                        # logging.debug("end utterence")
                        # text = model.finishStream(stream_context)
                        # print("Recognized: %s" % text)
                        # stream_context = model.createStream()
        # else:
            # print('missing model files at '+self.model_path)
# if __name__ == '__main__':
    
    
    # main(ARGS)






