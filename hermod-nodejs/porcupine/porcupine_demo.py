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

from io_buffer import BytesLoop
from thread_handler import ThreadHandler
# add resources for pvporcupine
sys.path.append(os.path.join(os.path.dirname(__file__), './binding/python'))
sys.path.append(os.path.join(os.path.dirname(__file__), './resources/util/python'))

from pvporcupine import Porcupine
from util import *

class PorcupineDemo():
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

        super(PorcupineDemo, self).__init__()
        self.logprint('init')
        self._library_path = library_path
        self._model_file_path = model_file_path
        self._keyword_file_paths = keyword_file_paths
        self._sensitivities = sensitivities
        self._input_device_index = input_device_index

        self._output_path = output_path
        if self._output_path is not None:
            self._recorded_frames = []
            
        self.audio_stream = BytesLoop()
        self.porcupine = None
          
       
        # mqtt related
        self.thread_handler = ThreadHandler()
        self.client = mqtt.Client()
        self.client.on_connect = self.on_connect
        self.client.on_disconnect = self.on_disconnect
        self.client.on_message = self.on_message
        self.mqtt_hostname = mqtt_hostname
        self.mqtt_port = int(mqtt_port)
        self.thread_targets=[self.startMqtt ,self.startMain]
        self.subscribe_to = 'hermod/{}/microphone/audio'.format(site)  
        self.site = site  
        self.logprint('init done SUBTO' + self.subscribe_to)          
      # start mqtt functions
      #####################
            
    def startMqtt(self, run_event):
        self.log("Connecting to {} on port {}".format(self.mqtt_hostname, str(self.mqtt_port)))
        retry = 0
        while run_event.is_set():
            try:
                self.log("Trying to connect to {} {}".format(self.mqtt_hostname,self.mqtt_port))
                self.client.connect(self.mqtt_hostname, self.mqtt_port, 60)
                break
            except (socket_error, Exception) as e:
                self.log("MQTT error {}".format(e))
                time.sleep(5 + int(retry / 5))
                retry = retry + 1
            # SUBSCRIBE 
            # for sub in self.subscribe_to.split(","):
                # self.log('sub to '+sub)
                # self.client.subscribe(sub)
                
        while run_event.is_set():
            self.client.loop()
            
      

    def on_connect(self, client, userdata, flags, result_code):
        self.log("Connected with result code {}".format(result_code))
        # SUBSCRIBE 
        for sub in self.subscribe_to.split(","):
            self.log('subscribe to {}'.format(sub))
            self.client.subscribe(sub)


    def on_disconnect(self, client, userdata, result_code):
        self.log("Disconnected with result code " + str(result_code))
        time.sleep(5)
        for threadTarget in self.thread_targets:
            self.thread_handler.run(target=threadTarget)

    def on_message(self, client, userdata, msg):
        self.logprint("MESSAGE {}".format(msg.topic))
        # self.logprint(userdata)
        #self.logprint(msg)
        #data = msg.payload[44:struct.unpack('<L', msg.payload[4:8])[0]]
        self.audio_stream.write(msg.payload) ;
        #msg.payload)        
        
    def log(self, message):
        self.logprint (message)

    def logprint(self,a):
        print(a);
        sys.stdout.flush()

        
     # end mqtt           
        

    def run(self):
        # start mqtt connection
        for threadTarget in self.thread_targets:
            self.logprint("RUN {}".format(threadTarget))
            self.thread_handler.run(target=threadTarget)
        self.thread_handler.start_run_loop()

            
    def startMain(self, run_event):
        """
         Creates an input audio stream, initializes wake word detection (Porcupine) object, and monitors the audio
         stream for occurrences of the wake word(s). It prints the time of detection for each occurrence and index of
         wake word.
         """
        self.logprint('startmain')

        num_keywords = len(self._keyword_file_paths)

        keyword_names = list()
        for x in self._keyword_file_paths:
            keyword_names.append(os.path.basename(x).replace('.ppn', '').replace('_compressed', '').split('_')[0])

        self.logprint('listening for:')
        for keyword_name, sensitivity in zip(keyword_names, self._sensitivities):
            self.logprint('- %s (sensitivity: %.2f)' % (keyword_name, sensitivity))

        pa = None
        try:
            self.porcupine = Porcupine(
                library_path=self._library_path,
                model_file_path=self._model_file_path,
                keyword_file_paths=self._keyword_file_paths,
                sensitivities=self._sensitivities)

            # pa = pyaudio.PyAudio()
            # audio_stream = pa.open(
                # rate=porcupine.sample_rate,
                # channels=1,
                # format=pyaudio.paInt16,
                # input=True,
                # frames_per_buffer=porcupine.frame_length,
                # input_device_index=self._input_device_index)
            self.logprint('args kw done')
            self.logprint('audio read loop')
            self.logprint('PFLen')
            self.logprint(self.porcupine.frame_length)    
            while True and run_event.is_set():
                #print('.')
                if (self.audio_stream.hasBytes(self.porcupine.frame_length*2)): 
                    self.logprint('have audio')
                    pcm = self.audio_stream.read(self.porcupine.frame_length*2)
                    pcm = struct.unpack_from("h" * self.porcupine.frame_length, pcm)
                    if self._output_path is not None:
                        self._recorded_frames.append(pcm)
                    result = self.porcupine.process(pcm)
                    if num_keywords == 1 and result:
                        self.logprint('[%s] detected keyword' % str(datetime.now()))
                    elif num_keywords > 1 and result >= 0:
                        self.logprint('[%s] detected %s' % (str(datetime.now()), keyword_names[result]))
                #print('+')
                #time.sleep(0.5)

        except KeyboardInterrupt:
            self.logprint('stopping ...')
        finally:
            if self.porcupine is not None:
                self.porcupine.delete()

            if self.audio_stream is not None:
                self.audio_stream.close()

            # if pa is not None:
                # pa.terminate()

            if self._output_path is not None and len(self._recorded_frames) > 0:
                recorded_audio = np.concatenate(self._recorded_frames, axis=0).astype(np.int16)
                soundfile.write(self._output_path, recorded_audio, samplerate=porcupine.sample_rate, subtype='PCM_16')

    _AUDIO_DEVICE_INFO_KEYS = ['index', 'name', 'defaultSampleRate', 'maxInputChannels']

    # @classmethod
    # def show_audio_devices_info(cls):
        # """ Provides information regarding different audio devices available. """

        # pa = pyaudio.PyAudio()

        # for i in range(pa.get_device_count()):
            # info = pa.get_device_info_by_index(i)
            # self.logprint(', '.join("'%s': '%s'" % (k, str(info[k])) for k in cls._AUDIO_DEVICE_INFO_KEYS))

        # pa.terminate()
