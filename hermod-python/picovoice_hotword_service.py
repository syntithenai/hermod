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
sys.path.append(os.path.join(os.path.dirname(__file__), './binding/python'))
sys.path.append(os.path.join(os.path.dirname(__file__), './resources/util/python'))

from pvporcupine import Porcupine
from util import *

from mqtt_service import MqttService



class HotwordService(MqttService):
    """
    Demo class for wake word detection (aka Porcupine) library. It creates an input audio stream from a microphone,
    monitors it, and upon detecting the specified wake word(s) prints the detection time and index of wake word on
    console. It optionally saves the recorded audio into a file for further review.
    """

    def __init__(
            self,
            library_path,
            model_file_path,
            keyword_file_paths,
            sensitivities,
            input_device_index=None,
            output_path=None,
            mqtt_hostname='localhost',
            mqtt_port=1883 ,
            site = 'default'
            
            ):

        """
        Constructor.

        :param library_path: Absolute path to Porcupine's dynamic library.
        :param model_file_path: Absolute path to the model parameter file.
        :param keyword_file_paths: List of absolute paths to keyword files.
        :param sensitivities: Sensitivity parameter for each wake word. For more information refer to
        'include/pv_porcupine.h'. It uses the
        same sensitivity value for all keywords.
        :param input_device_index: Optional argument. If provided, audio is recorded from this input device. Otherwise,
        the default audio input device is used.
        :param output_path: If provided recorded audio will be stored in this location at the end of the run.
        """

        super(HotwordService, self).__init__()
        self._library_path = library_path
        self._model_file_path = model_file_path
        self._keyword_file_paths = keyword_file_paths
        self._sensitivities = sensitivities
        self._input_device_index = input_device_index

        self._output_path = output_path
        if self._output_path is not None:
            self._recorded_frames = []
            
        self.thread_targets.append(self.startMain)    
        self.audio_stream = BytesLoop()
        self.porcupine = None
        self.site = site
        self.started = True
        self.subscribe_to='hermod/'+site+'/microphone/audio,hermod/'+site+'/hotword/start,hermod/'+site+'/hotword/stop'
    

    def on_message(self, client, userdata, msg):
        topic = "{}".format(msg.topic)
        self.log("MESSAGE {}".format(topic))
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
        """
         Creates an input audio stream, initializes wake word detection (Porcupine) object, and monitors the audio
         stream for occurrences of the wake word(s). It prints the time of detection for each occurrence and index of
         wake word.
         """

        num_keywords = len(self._keyword_file_paths)

        keyword_names = list()
        for x in self._keyword_file_paths:
            keyword_names.append(os.path.basename(x).replace('.ppn', '').replace('_compressed', '').split('_')[0])

        self.log('listening for:')
        for keyword_name, sensitivity in zip(keyword_names, self._sensitivities):
            self.log('- %s (sensitivity: %.2f)' % (keyword_name, sensitivity))

        pa = None
        try:
            self.porcupine = Porcupine(
                library_path=self._library_path,
                model_file_path=self._model_file_path,
                keyword_file_paths=self._keyword_file_paths,
                sensitivities=self._sensitivities)
            while True and run_event.is_set():
                # 
                if (self.started == True and self.audio_stream.hasBytes(self.porcupine.frame_length*2)): 
                    pcm = self.audio_stream.read(self.porcupine.frame_length*2)
                    pcm = struct.unpack_from("h" * self.porcupine.frame_length, pcm)
                    if self._output_path is not None:
                        self._recorded_frames.append(pcm)
                    result = self.porcupine.process(pcm)
                    if num_keywords == 1 and result:
                        self.log('[%s] detected keyword' % str(datetime.now()))
                        self.client.publish('hermod/'+self.site+'/hotword/detected',json.dumps({'hotword': keyword_names[0]}))
                    elif num_keywords > 1 and result >= 0:
                        self.log('[%s] detected %s' % (str(datetime.now()), keyword_names[result]))
                        #self.log('SITE {}'.format(self.site))
                        self.client.publish('hermod/'+self.site+'/hotword/detected',json.dumps({'hotword': keyword_names[result]}))
    
        except KeyboardInterrupt:
            self.log('stopping ...')
        finally:
            if self.porcupine is not None:
                self.porcupine.delete()

            if self.audio_stream is not None:
                self.audio_stream.close()
