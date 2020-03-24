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
            config
            ):

        self.config = config

        super(DeepspeechAsrService, self).__init__(config)
        self.thread_targets.append(self.startASR)    
       
        self.sample_rate = self.RATE_PROCESS
        self.block_size = int(self.RATE_PROCESS / float(self.BLOCKS_PER_SECOND))
        self.frame_duration_ms = 1000 * self.block_size // self.sample_rate
        self.vad = webrtcvad.Vad(config['services']['DeepspeechAsrService'].get('vad_sensitivity',0))
        self.modelFile = 'output_graph.pbmm'
        
        # TFLITE model for ARM architecture
        system,  release, version, machine, processor = os.uname()                
        #self.log([system,  release, version, machine, processor])
        if processor == 'armv7l': self.modelFile = 'output_graph.tflite'
        
        
        self.audio_stream = {} #BytesLoop()
        self.started = {} #False
        self.active = {} #False
        self.models = {}
        self.stream_contexts = {}
        
        self.model_path = config['services']['DeepspeechAsrService']['model_path']
        self.subscribe_to='hermod/+/asr/activate,hermod/+/asr/deactivate,hermod/+/asr/start,hermod/+/asr/stop'
    

    def on_message(self, client, userdata, msg):
        topic = "{}".format(msg.topic)
        #self.log("MESSAGE {}".format(topic))
        parts = topic.split("/")
        site = parts[1]
        activateTopic = 'hermod/' +site+'/asr/activate'
        deactivateTopic = 'hermod/' +site+'/asr/deactivate'
        startTopic = 'hermod/' +site+'/asr/start'
        stopTopic = 'hermod/'+site+'/asr/stop'
        audioTopic = 'hermod/'+site+'/microphone/audio'
        if topic == activateTopic:
            self.activate(site)
        elif topic == deactivateTopic:
            self.deactivate(site)
        elif topic == startTopic:
            self.started[site] = True
        elif topic == stopTopic:
            self.started[site] = False
        elif topic == audioTopic :
            self.audio_stream[site].write(msg.payload) ;
        
    def activate(self,site):
        #if not self.active[site]:
            self.audio_stream[site] = BytesLoop()
            self.active[site] = True
            self.started[site] = False
            self.client.subscribe('hermod/'+site+'/microphone/audio')
              # Load DeepSpeech model
            if os.path.isdir(self.model_path):
                modelPath = os.path.join(self.model_path, self.modelFile)
                lm = os.path.join(self.model_path, 'lm.binary')
                trie = os.path.join(self.model_path, 'trie')

                self.models[site] = deepspeech.Model(modelPath, 500)
                if lm and trie:
                    self.models[site].enableDecoderWithLM(lm, trie, 0.75, 1.85)
            
                self.stream_contexts[site] = self.models[site].createStream()
            
   
    def deactivate(self,site):
        #if self.active[site]:
            self.client.unsubscribe('hermod/'+site+'/microphone/audio')
            self.audio_stream.pop(site, '')
            self.active[site] = False
            self.started[site] = False
        

    def read(self,site):
        a = self.audio_stream[site].read(self.block_size*2);
        return a
        
    def frame_generator(self,site):
        """Generator that yields all audio frames."""
        while True:
            if self.audio_stream[site].has_bytes(self.block_size*2):
                yield self.read(site)
            time.sleep(0.0001)
            #padding_ms=300
            
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
            if len(frame) < 1:  # 640
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
        if os.path.isdir(self.model_path):
            while True and run_event.is_set():
                time.sleep(0.001)
                for site in self.active:
                    if (site in self.models and site in self.stream_contexts and self.active[site] == True):
                        frames = self.vad_collector(site)

                        for frame in frames:
                            if self.started[site] == True:
                                if frame is not None:
                                   # self.log('feed content')
                                    self.models[site].feedAudioContent(self.stream_contexts[site], np.frombuffer(frame, np.int16))
                                else:
                                    text = self.models[site].finishStream(self.stream_contexts[site])
                                    self.log('got text {}'.format(text))
                                    if (len(text) > 0):
                                        self.client.publish('hermod/'+site+'/asr/text',json.dumps({'text':text}))
                                    del self.stream_contexts[site]
                                    self.stream_contexts[site] = self.models[site].createStream()
                            #time.sleep(0.001)
        else:
            print('missing model files at '+self.model_path) 
    
  


