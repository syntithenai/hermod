import os
import struct
import sys
from datetime import datetime
from threading import Thread
import json
import time
import wave
import io
from socket import error as socket_error
import paho.mqtt.client as mqtt
import warnings
import numpy as np
#import pyaudio
import soundfile
import json

from io_buffer import BytesLoop
from thread_handler import ThreadHandler
# add resources for pvporcupine
sys.path.append(os.path.join(os.path.dirname(__file__), './porcupine/binding/python'))
sys.path.append(os.path.join(os.path.dirname(__file__), './porcupine/resources/util/python'))

from pvporcupine import Porcupine
from util import *

from mqtt_service import MqttService


###############################################
# This class implements a service that listens for mqtt audio packets and emits hotword/detected messages
# It responds to hotword/activate, hotword/deactivate to initialise the service and hotword/start and hotword/stop to 
# activate audio processing.
###############################################
 
class picovoice_hotword_service(MqttService):
  
    def __init__(
            self,
            config
            ):
        super(picovoice_hotword_service, self).__init__(config['mqtt_hostname'],config['mqtt_port'],config['site'])
        self.config = config    
        self.thread_targets.append(self.startMain)    
        self.audio_stream = {} #BytesLoop()
        self.porcupine = {}
        self.started = {}
        self.active = {}
        self.subscribe_to='hermod/+/hotword/start,hermod/+/hotword/stop,hermod/+/hotword/activate,hermod/+/hotword/deactivate'
        
        # setup keyword and sensitivity arrays
        self.keywords = [x.strip() for x in self.config['services']['picovoice_hotword_service']['hotwords'].split(',')]
        if all(x in KEYWORDS for x in self.keywords):
            self.keyword_file_paths = [KEYWORD_FILE_PATHS[x] for x in self.keywords]
        else:
            raise ValueError(
                'selected keywords are not available by default. available keywords are: %s' % ', '.join(KEYWORDS))
        
        sense_p = self.config['services']['picovoice_hotword_service']['sensitivity']
        if isinstance(sense_p, float):
            self.sensitivities = [sense_p] * len(self.keyword_file_paths)
        else:
            self.sensitivities = [float(x) for x in sense_p.split(',')]
                   
        self.num_keywords = len(self.keyword_file_paths)

        self.keyword_names = list()
        for x in self.keyword_file_paths:
            self.keyword_names.append(os.path.basename(x).replace('.ppn', '').replace('_compressed', '').split('_')[0])

        # self.log('listening for:')
        # for keyword_name, sensitivity in zip(self.keyword_names, self.sensitivities):
            # self.log('- %s (sensitivity: %.2f)' % (keyword_name, sensitivity))

       

    def on_message(self, client, userdata, msg):
        topic = "{}".format(msg.topic)
        parts = topic.split('/')
        site = parts[1] 
        #self.log("MESSAGE {} -  {}".format(site,topic))
        startTopic = 'hermod/' +site+'/hotword/start'
        stopTopic = 'hermod/'+site+'/hotword/stop'
        audioTopic = 'hermod/'+site+'/microphone/audio'
        activateTopic = 'hermod/'+site+'/hotword/activate'
        deactivateTopic = 'hermod/'+site+'/hotword/deactivate'
        if topic == activateTopic:
            self.activate(site)
        elif topic == deactivateTopic:
            self.deactivate(site)
        elif topic == startTopic:
            if (self.active[site] == True):
                self.started[site] = True 
        elif topic == stopTopic:
            self.started[site] = False
        elif topic == audioTopic :
            if site in self.audio_stream:
                self.audio_stream[site].write(msg.payload) 
        
    def activate(self,site):
        self.active[site] = True
        self.started[site] = False
        self.audio_stream[site] = BytesLoop()
        self.client.subscribe('hermod/'+site+'/microphone/audio')
        self.porcupine[site] = Porcupine(
                library_path=LIBRARY_PATH,
                model_file_path=MODEL_FILE_PATH,
                keyword_file_paths=self.keyword_file_paths,
                sensitivities=self.sensitivities)        
      
    def deactivate(self,site):
        self.active[site] = False
        self.started[site] = False
        # unsub audio
        self.client.unsubscribe('hermod/'+site+'/microphone/audio')
        # destroy porcupine and audio
        if self.porcupine[site] is not None:
            self.porcupine[site].delete()
        if self.audio_stream[site] is not None:
            self.audio_stream[site].close()
                
                
    def startMain(self, run_event):
        try:
            while True and run_event.is_set():
                # 
                for site in self.active:
                    if (site in self.porcupine and self.active[site] == True and self.started[site] == True  and self.audio_stream[site].hasBytes(self.porcupine[site].frame_length*2)):
                        pcm = self.audio_stream[site].read(self.porcupine[site].frame_length*2)
                        pcm = struct.unpack_from("h" * self.porcupine[site].frame_length, pcm)
                        result = self.porcupine[site].process(pcm)
                        if self.num_keywords == 1 and result:
                            self.client.publish('hermod/'+site+'/hotword/detected',json.dumps({'hotword': self.keyword_names[0]}))
                        elif self.num_keywords > 1 and result >= 0:
                            self.client.publish('hermod/'+site+'/hotword/detected',json.dumps({'hotword': self.keyword_names[result]}))
        
                    
        except KeyboardInterrupt:
            pass
       
