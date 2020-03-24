"""
This class implements a service that listens for mqtt audio packets and emits hotword/detected messages
It responds to hotword/activate, hotword/deactivate to initialise the service and hotword/start and hotword/stop to
activate audio processing.
"""

import os
import struct
import sys
import json
import time

from mqtt_service import MqttService
from io_buffer import BytesLoop

# add resources for pvporcupine
sys.path.append(
    os.path.join(
        os.path.dirname(__file__),
        '../porcupine/binding/python'))
from pvporcupine import Porcupine

sys.path.append(
    os.path.join(
        os.path.dirname(__file__),
        '../porcupine/resources/util/python'))
from util import *



class PicovoiceHotwordService(MqttService):
    """ Hotword Service Class """
    def __init__(
            self,
            config
    ):
        super(
            PicovoiceHotwordService,
            self).__init__(config)
        self.config = config
        self.thread_targets.append(self.start_main)
        self.audio_stream = {}  # BytesLoop()
        self.porcupine = {}
        self.started = {}
        self.active = {}
        self.subscribe_to = 'hermod/+/hotword/start,hermod/+/hotword/stop,hermod/+/hotword/activate,hermod/+/hotword/deactivate'

        # setup keyword and sensitivity arrays
        self.keywords = [x.strip() for x in self.config['services']
                         ['PicovoiceHotwordService']['hotwords'].split(',')]
        if all(x in KEYWORDS for x in self.keywords):
            self.keyword_file_paths = [
                KEYWORD_FILE_PATHS[x] for x in self.keywords]
        else:
            raise ValueError(
                'selected keywords are not available by default. available keywords are: %s' %
                ', '.join(KEYWORDS))

        sense_p = self.config['services']['PicovoiceHotwordService']['sensitivity']
        if isinstance(sense_p, float):
            self.sensitivities = [sense_p] * len(self.keyword_file_paths)
        else:
            self.sensitivities = [float(x) for x in sense_p.split(',')]

        self.num_keywords = len(self.keyword_file_paths)

        self.keyword_names = list()
        for x in self.keyword_file_paths:
            self.keyword_names.append(
                os.path.basename(x).replace(
                    '.ppn', '').replace(
                        '_compressed', '').split('_')[0])

        self.log('listening for:')
        for keyword_name, sensitivity in zip(self.keyword_names, self.sensitivities):
            self.log('- %s (sensitivity: %.2f)' % (keyword_name, sensitivity))

    def on_message(self, client, userdata, msg):
        topic = "{}".format(msg.topic)
        parts = topic.split('/')
        site = parts[1]
        #self.log("MESSAGE {} -  {}".format(site,topic))
        if topic == 'hermod/' + site + '/hotword/activate':
            self.activate(site)
        elif topic == 'hermod/' + site + '/hotword/deactivate':
            self.deactivate(site)
        elif topic == 'hermod/' + site + '/hotword/start':
            # self.log('started')
            #if self.active[site]:
            self.started[site] = True
        elif topic == 'hermod/' + site + '/hotword/stop':
            # self.log('stopped')
            self.started[site] = False
        elif topic == 'hermod/' + site + '/microphone/audio':
            if site in self.audio_stream:
                self.audio_stream[site].write(msg.payload)

    def activate(self, site):
        self.active[site] = True
        self.started[site] = False
        self.audio_stream[site] = BytesLoop()
        self.client.subscribe('hermod/' + site + '/microphone/audio')
        self.porcupine[site] = Porcupine(
            library_path=LIBRARY_PATH,
            model_file_path=MODEL_FILE_PATH,
            keyword_file_paths=self.keyword_file_paths,
            sensitivities=self.sensitivities)
        # self.log('activated')

    def deactivate(self, site):
        self.active[site] = False
        self.started[site] = False
        # unsub audio
        self.client.unsubscribe('hermod/' + site + '/microphone/audio')
        # destroy porcupine and audio
        if self.porcupine[site] is not None:
            self.porcupine[site].delete()
        if self.audio_stream[site] is not None:
            self.audio_stream[site].close()
        # self.log('deactivated')
        
    def start_main(self, run_event):
        # self.log('start main')
        try:
            while True and run_event.is_set():
                time.sleep(0.01)
                for site in self.active:
                    #self.log(site)
                    if site in self.porcupine and self.active[site] and self.started[site] and self.audio_stream[site].has_bytes(
                            self.porcupine[site].frame_length * 2):
                        pcm = self.audio_stream[site].read(
                            self.porcupine[site].frame_length * 2)
                        pcm = struct.unpack_from(
                            "h" * self.porcupine[site].frame_length, pcm)
                        result = self.porcupine[site].process(pcm)
                        # self.log(result)
                        if self.num_keywords == 1 and result:
                            self.log('HOTWORD DETECTED')
                            self.client.publish(
                                'hermod/' + site + '/hotword/detected', json.dumps({'hotword': self.keyword_names[0]}))
                        elif self.num_keywords > 1 and result >= 0:
                            self.log('HOTWORD DETECTED')
                            self.client.publish(
                                'hermod/' + site + '/hotword/detected', json.dumps({'hotword': self.keyword_names[result]}))

        except KeyboardInterrupt:
            pass
