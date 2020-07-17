""" Picovoice based Hotword Service """

import os
import struct
import sys
import json
import asyncio
# from util import *
from pvporcupine import Porcupine

from MqttService import MqttService
from io_buffer import BytesLoop

# add resources for pvporcupine
sys.path.append(
    os.path.join(
        os.path.dirname(__file__),
        '../porcupine/binding/python'))

sys.path.append(
    os.path.join(
        os.path.dirname(__file__),
        '../porcupine/resources/util/python'))

#from util import KEYWORDS, KEYWORD_FILE_PATH, MODEL_FILE_PATH, LIBRARY_PATH
from util import *

class PicovoiceHotwordService(MqttService):
    """
    This class implements a service that listens for mqtt audio packets and emits
    hotword/detected messages
    It responds to hotword/activate, hotword/deactivate to initialise the service and
    hotword/start and hotword/stop to activate audio processing.
    """
    def __init__(
            self,
            config,
            loop
    ):
        """constructor"""
        super(
            PicovoiceHotwordService,
            self).__init__(config, loop)
        self.config = config
        self.also_run = [self.start_main]
        self.audio_stream = {}  # BytesLoop()
        self.porcupine = {}
        self.started = {}
        self.active = {}
        self.subscribe_to = 'hermod/+/hotword/start,hermod/+/hotword/stop,' \
        + 'hermod/+/hotword/activate,hermod/+/hotword/deactivate'

        # setup keyword and sensitivity arrays
        self.keywords = [x.strip() for x in self.config['services']
                         ['PicovoiceHotwordService']['hotwords'].split(',')]
        if all(keyword in KEYWORDS for keyword in self.keywords):
            self.keyword_file_paths = [
                KEYWORD_FILE_PATHS[keyword] for keyword in self.keywords]
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
        for keyword in self.keyword_file_paths:
            self.keyword_names.append(
                os.path.basename(keyword).replace(
                    '.ppn', '').replace(
                        '_compressed', '').split('_')[0])

        self.log('listening for:')
        for keyword_name, sensitivity in zip(
                self.keyword_names, self.sensitivities):
            self.log('- %s (sensitivity: %.2f)' % (keyword_name, sensitivity))

    async def on_message(self, message):
        """handle an mqtt message"""
        topic = "{}".format(message.topic)
        parts = topic.split('/')
        site = parts[1]
        if topic == 'hermod/' + site + '/hotword/activate':
            await self.activate(site)
        elif topic == 'hermod/' + site + '/hotword/deactivate':
            await self.deactivate(site)
        elif topic == 'hermod/' + site + '/hotword/start':
            self.started[site] = True
        elif topic == 'hermod/' + site + '/hotword/stop':
            self.started[site] = False
        elif topic == 'hermod/' + site + '/microphone/audio':
            if site in self.audio_stream:
                self.audio_stream[site].write(message.payload)

    async def activate(self, site):
        """activate hotword service for a site"""
        self.active[site] = True
        self.started[site] = False
        self.audio_stream[site] = BytesLoop()
        await self.client.subscribe('hermod/' + site + '/microphone/audio')
        self.porcupine[site] = Porcupine(
            library_path=LIBRARY_PATH,
            model_file_path=MODEL_FILE_PATH,
            keyword_file_paths=self.keyword_file_paths,
            sensitivities=self.sensitivities)

    async def deactivate(self, site):
        """deactivate hotword service for a site """
        self.active[site] = False
        self.started[site] = False
        # unsub audio
        await self.client.unsubscribe('hermod/' + site + '/microphone/audio')
        # destroy porcupine and audio
        if self.porcupine[site] is not None:
            self.porcupine[site].delete()
        if self.audio_stream[site] is not None:
            self.audio_stream[site].close()

    async def start_main(self):
        """start the hotword service"""
        try:
            while True:
                await asyncio.sleep(0.001)
                for site in self.active:
                    if site in self.porcupine and self.active[site] and self.started[site] and \
                    self.audio_stream[site].has_bytes(
                            self.porcupine[site].frame_length * 2):
                        pcm = self.audio_stream[site].read(
                            self.porcupine[site].frame_length * 2)
                        pcm = struct.unpack_from(
                            "h" * self.porcupine[site].frame_length, pcm)
                        result = self.porcupine[site].process(pcm)
                        if self.num_keywords == 1 and result:
                            await self.client.publish('hermod/' + site + '/hotword/detected', \
                            json.dumps({
                                'hotword': self.keyword_names[0]
                            }))
                        elif self.num_keywords > 1 and result >= 0:
                            await self.client.publish('hermod/' + site + '/hotword/detected', \
                            json.dumps({
                                'hotword': self.keyword_names[result]
                            }))

        except KeyboardInterrupt:
            pass
