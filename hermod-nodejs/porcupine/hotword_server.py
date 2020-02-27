#
# Copyright 2018 Picovoice Inc.
#
# You may not use this file except in compliance with the license. A copy of the license is located in the "LICENSE"
# file accompanying this source.
#
# Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on
# an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
# specific language governing permissions and limitations under the License.
#

import argparse
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

from thread_handler import ThreadHandler
import warnings

import numpy as np
import pyaudio
import soundfile

sys.path.append(os.path.join(os.path.dirname(__file__), './binding/python'))
sys.path.append(os.path.join(os.path.dirname(__file__), './resources/util/python'))

from pvporcupine import Porcupine
from util import *

def logprint(a):
    print(a);
    sys.stdout.flush()


logprint('start file')


class BytesLoop:
    def __init__(self, s=b''):
        self.buffer = s
        
    def hasBytes(self,n):
        # self.logprint('hasbytes')
        # self.logprint(n)
        # self.logprint(len(self.buffer))
        
    #    a = 'hasBytes n {} :b {}'
        #.format(n,len(self.buffer)
     #   self.logprint(a)
        if (n < 0 and (len(self.buffer) > n or len(self.buffer) == n)):
            return True
        else:
            return False    

    def read(self, n=-1):
        self.logprint('read from buffer')
        self.logprint(n)
        self.logprint(self.length())
        #if (n < 0 or (len(self.buffer) >= n):
        chunk = self.buffer[:n]
        self.buffer = self.buffer[n:]
        return chunk
        #else:
        #    return False
            
    def length(self):
        return len(self.buffer)

    def write(self, s):
        self.logprint('write to buffer')
        self.logprint(len(s));
        self.logprint(self.length())
        self.buffer += s
        
    def close(self):
        return True
    
    def logprint(self,a):
        print(a);
        sys.stdout.flush()



class PorcupineDemo(Thread):
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
           
       
        # mqtt related
        self.thread_handler = ThreadHandler()
        self.client = mqtt.Client()
        self.client.on_connect = self.on_connect
        self.client.on_disconnect = self.on_disconnect
        self.client.on_message = self.on_message
        self.mqtt_hostname = mqtt_hostname
        self.mqtt_port = int(mqtt_port)
        self.thread_targets=[self.startMqtt,self.startMain]
        self.subscribe_to = 'hermod/{}/microphone/audio'.format(site)  
        self.site = site  
        self.logprint('init done SUBTO' + self.subscribe_to)          
      # start mqtt functions
      #####################
            
    def startMqtt(self, run_event):
        self.log("Connecting to {} on port {}".format(self.mqtt_hostname, str(self.mqtt_port)))
        retry = 0
        while True and run_event.is_set():
            try:
                self.log("Trying to connect to {} {}".format(self.mqtt_hostname,self.mqtt_port))
                self.client.connect(self.mqtt_hostname, self.mqtt_port, 60)
                break
            except (socket_error, Exception) as e:
                self.log("MQTT error {}".format(e))
                time.sleep(5 + int(retry / 5))
                retry = retry + 1
        # SUBSCRIBE 
        for sub in self.subscribe_to.split(","):
            self.client.subscribe(sub)
            
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
        self.log("MESSAGE {}".format(msg.topic))
        #data = msg.payload[44:struct.unpack('<L', msg.payload[4:8])[0]]
        self.audio_stream.write(msg)        
        
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

        porcupine = None
        pa = None
        try:
            porcupine = Porcupine(
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
                
            while True and run_event.is_set():
                if (self.audio_stream.hasBytes(porcupine.frame_length)): 
                    self.logprint('have audio')
                    pcm = self.audio_stream.read(porcupine.frame_length)
                    pcm = struct.unpack_from("h" * porcupine.frame_length, pcm)
                    if self._output_path is not None:
                        self._recorded_frames.append(pcm)
                    result = porcupine.process(pcm)
                    if num_keywords == 1 and result:
                        self.logprint('[%s] detected keyword' % str(datetime.now()))
                    elif num_keywords > 1 and result >= 0:
                        self.logprint('[%s] detected %s' % (str(datetime.now()), keyword_names[result]))

        except KeyboardInterrupt:
            self.logprint('stopping ...')
        finally:
            if porcupine is not None:
                porcupine.delete()

            if self.audio_stream is not None:
                self.audio_stream.close()

            if pa is not None:
                pa.terminate()

            if self._output_path is not None and len(self._recorded_frames) > 0:
                recorded_audio = np.concatenate(self._recorded_frames, axis=0).astype(np.int16)
                soundfile.write(self._output_path, recorded_audio, samplerate=porcupine.sample_rate, subtype='PCM_16')

    _AUDIO_DEVICE_INFO_KEYS = ['index', 'name', 'defaultSampleRate', 'maxInputChannels']

    @classmethod
    def show_audio_devices_info(cls):
        """ Provides information regarding different audio devices available. """

        pa = pyaudio.PyAudio()

        for i in range(pa.get_device_count()):
            info = pa.get_device_info_by_index(i)
            self.logprint(', '.join("'%s': '%s'" % (k, str(info[k])) for k in cls._AUDIO_DEVICE_INFO_KEYS))

        pa.terminate()


def main():
    logprint('main')
    #return
    parser = argparse.ArgumentParser()

    parser.add_argument('--mqtt_hostname', help='mqtt hostname eg localhost', default='localhost')

    parser.add_argument('--mqtt_port', help='mqtt port number', default='1883')

    parser.add_argument('--site', help='hermod site id', default='jest')

    parser.add_argument('--keywords', help='comma-separated list of default keywords (%s)' % ', '.join(KEYWORDS), default='picovoice')

    parser.add_argument('--keyword_file_paths', help='comma-separated absolute paths to keyword files')

    parser.add_argument('--library_path', help="absolute path to Porcupine's dynamic library", default=LIBRARY_PATH)

    parser.add_argument('--model_file_path', help='absolute path to model parameter file', default=MODEL_FILE_PATH)

    parser.add_argument('--sensitivities', help='detection sensitivity [0, 1]', default=0.5)

    parser.add_argument('--input_audio_device_index', help='index of input audio device', type=int, default=None)

    parser.add_argument(
        '--output_path',
        help='absolute path to where recorded audio will be stored. If not set, it will be bypassed.')

    parser.add_argument('--show_audio_devices_info', action='store_true')

    args = parser.parse_args()
    logprint('main args')
    if args.show_audio_devices_info:
        logprint('args show devices')
        PorcupineDemo.show_audio_devices_info()
    else:
        if args.keyword_file_paths is None:
            if args.keywords is None:
                raise ValueError('either --keywords or --keyword_file_paths must be set')

            keywords = [x.strip() for x in args.keywords.split(',')]
            logprint('args kw ok')
            if all(x in KEYWORDS for x in keywords):
                keyword_file_paths = [KEYWORD_FILE_PATHS[x] for x in keywords]
            else:
                raise ValueError(
                    'selected keywords are not available by default. available keywords are: %s' % ', '.join(KEYWORDS))
        else:
            keyword_file_paths = [x.strip() for x in args.keyword_file_paths.split(',')]
            logprint('args kw done')

        if isinstance(args.sensitivities, float):
            sensitivities = [args.sensitivities] * len(keyword_file_paths)
        else:
            sensitivities = [float(x) for x in args.sensitivities.split(',')]
        logprint('args sense done')
        PorcupineDemo(
            library_path=args.library_path,
            model_file_path=args.model_file_path,
            keyword_file_paths=keyword_file_paths,
            sensitivities=sensitivities,
            output_path=args.output_path,
            input_device_index=args.input_audio_device_index,
            mqtt_hostname=args.mqtt_hostname,
            mqtt_port=args.mqtt_port,
            site=args.site).run()


logprint('__NAME__  {}'.format(__name__))

if __name__ == '__main__':
    main()



logprint('done file')
