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
          #  self.log('act')
            self.activate(site)
        elif topic == deactivateTopic:
            #self.log('eact')
            self.deactivate(site)
        elif topic == startTopic:
            #self.log('start')
            if (self.active[site] == True):
                self.started[site] = True 
        elif topic == stopTopic:
            #self.log('stop')
            self.started[site] = False
        elif topic == audioTopic :
           # self.log('audio')
            if site in self.audio_stream:
                #self.log('audio')
                self.audio_stream[site].write(msg.payload) 
        
    def activate(self,site):
      #  self.log(['activate',site,self.active,self.started]) 
        self.active[site] = True
        self.started[site] = False
        self.audio_stream[site] = BytesLoop()
        self.client.subscribe('hermod/'+site+'/microphone/audio')
        self.porcupine[site] = Porcupine(
                library_path=LIBRARY_PATH,
                model_file_path=MODEL_FILE_PATH,
                keyword_file_paths=self.keyword_file_paths,
                sensitivities=self.sensitivities)        
        # if (len(site) > 0):
            # self.log(self.active[site])
            # if (True or self.active[site] != True):
                # self.active[site] = True
                # self.audio_stream[site] = BytesLoop()
                # # subscribe mqtt
                # #self.client.subscribe('hermod/'+site+'/microphone/audio')
                # # instantiate porcupine and audio
                # # self.porcupine[site] = Porcupine(
                # # library_path=LIBRARY_PATH,
                # # model_file_path=MODEL_FILE_PATH,
                # # keyword_file_paths=self.keyword_file_paths,
                # # sensitivities=self.sensitivities)
      #  self.log(['activated',site,self.active,self.started])   

    def deactivate(self,site):
        # if len(site) > 0:
            # if (self.active[site] == True):
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
      # self.log('STARTMAIN')
      # pa = None
       try:
            # self.porcupine = Porcupine(
                # library_path=LIBRARY_PATH,
                # model_file_path=MODEL_FILE_PATH,
                # keyword_file_paths=self.keyword_file_paths,
                # sensitivities=self.sensitivities)
           while True and run_event.is_set():
                # 
               for site in self.active:
                  
                   if (site in self.porcupine and self.active[site] == True and self.started[site] == True  and self.audio_stream[site].hasBytes(self.porcupine[site].frame_length*2)):
                       #self.log('HOTWORD FRAME')
                       pcm = self.audio_stream[site].read(self.porcupine[site].frame_length*2)
                       pcm = struct.unpack_from("h" * self.porcupine[site].frame_length, pcm)
                       result = self.porcupine[site].process(pcm)
                       if self.num_keywords == 1 and result:
                        #   self.log('[%s] detected keyword' % str(datetime.now()))
                           self.client.publish('hermod/'+site+'/hotword/detected',json.dumps({'hotword': self.keyword_names[0]}))
                       elif self.num_keywords > 1 and result >= 0:
                         #  self.log('[%s] detected %s' % (str(datetime.now()), self.keyword_names[result]))
                          # self.log('SITE {}'.format(site))
                           self.client.publish('hermod/'+site+'/hotword/detected',json.dumps({'hotword': self.keyword_names[result]}))
        
                  # self.log(site)
               # self.log('site')
               #time.sleep(2)  
                # if (self.started == True and self.audio_stream.hasBytes(self.porcupine.frame_length*2)): 
                    # self.log('HOTWORD FRAME')
                    # # if self._output_path is not None:
                        # # self._recorded_frames.append(pcm)
                    
       except KeyboardInterrupt:
            pass
           # # self.log('stopping ...')
        # finally:
            # if self.porcupine is not None:
                # self.porcupine.delete()

            # if self.audio_stream is not None:
                # self.audio_stream.close()
