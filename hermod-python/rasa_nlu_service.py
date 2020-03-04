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

        self.site = config['site']
            
        self.thread_targets.append(self.startMain)    
        self.audio_stream = BytesLoop()
        self.porcupine = None
        self.started = True
        self.subscribe_to='hermod/'+self.site+'/microphone/audio,hermod/'+self.site+'/hotword/start,hermod/'+self.site+'/hotword/stop'
    

    def on_message(self, client, userdata, msg):
        topic = "{}".format(msg.topic)
        #self.log("MESSAGE {}".format(topic))
        startTopic = 'hermod/' +self.site+'/hotword/start'
        stopTopic = 'hermod/'+self.site+'/hotword/stop'
        audioTopic = 'hermod/'+self.site+'/microphone/audio'
        if topic == startTopic:
            self.started = True ;
        elif topic == stopTopic:
            self.started = False;
        elif topic == audioTopic :
            self.audio_stream.write(msg.payload) ;
        
            

            
    def startMain(self, run_event):
       # print('START HOTWORD')
        # setup keyword and sensitivity arrays
        keywords = [x.strip() for x in self.config['services']['picovoice_hotword_service']['hotwords'].split(',')]
       # self.log('args kw ok')
        if all(x in KEYWORDS for x in keywords):
            keyword_file_paths = [KEYWORD_FILE_PATHS[x] for x in keywords]
        else:
            raise ValueError(
                'selected keywords are not available by default. available keywords are: %s' % ', '.join(KEYWORDS))
        sense_p = self.config['services']['picovoice_hotword_service']['sensitivity']
        if isinstance(sense_p, float):
            sensitivities = [sense_p] * len(keyword_file_paths)
        else:
            sensitivities = [float(x) for x in sense_p.split(',')]
       
                   
        num_keywords = len(keyword_file_paths)

        keyword_names = list()
        for x in keyword_file_paths:
            keyword_names.append(os.path.basename(x).replace('.ppn', '').replace('_compressed', '').split('_')[0])

        #self.log('listening for:')
       # for keyword_name, sensitivity in zip(keyword_names, sensitivities):
        #     self.log('- %s (sensitivity: %.2f)' % (keyword_name, sensitivity))

        #self.log('START HOTWORD 2')
        pa = None
        try:
            self.porcupine = Porcupine(
                library_path=LIBRARY_PATH,
                model_file_path=MODEL_FILE_PATH,
                keyword_file_paths=keyword_file_paths,
                sensitivities=sensitivities)
            while True and run_event.is_set():
                # 
                if (self.started == True and self.audio_stream.hasBytes(self.porcupine.frame_length*2)): 
                    #self.log('HOTWORD FRAME')
                    pcm = self.audio_stream.read(self.porcupine.frame_length*2)
                    pcm = struct.unpack_from("h" * self.porcupine.frame_length, pcm)
                    # # if self._output_path is not None:
                        # # self._recorded_frames.append(pcm)
                    result = self.porcupine.process(pcm)
                    if num_keywords == 1 and result:
                       # self.log('[%s] detected keyword' % str(datetime.now()))
                        self.client.publish('hermod/'+self.site+'/hotword/detected',json.dumps({'hotword': keyword_names[0]}))
                    elif num_keywords > 1 and result >= 0:
                       # self.log('[%s] detected %s' % (str(datetime.now()), keyword_names[result]))
                        #self.log('SITE {}'.format(self.site))
                        self.client.publish('hermod/'+self.site+'/hotword/detected',json.dumps({'hotword': keyword_names[result]}))
    
        except KeyboardInterrupt:
           pass
           # self.log('stopping ...')
        finally:
            if self.porcupine is not None:
                self.porcupine.delete()

            if self.audio_stream is not None:
                self.audio_stream.close()
