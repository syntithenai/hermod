from mqtt_service import MqttService
from util import *
from pvporcupine import Porcupine
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
import warnings
import numpy as np
import requests


class RasaCoreService(MqttService):

    def __init__(
            self,
            config
    ):
        super(
            picovoice_hotword_service,
            self).__init__(config)
        self.config = config

        self.subscribe_to = 'hermod/' + self.site + '/microphone/audio,hermod/' + \
            self.site + '/hotword/start,hermod/' + self.site + '/hotword/stop'

    def on_message(self, client, userdata, msg):
        topic = "{}".format(msg.topic)
        #self.log("MESSAGE {}".format(topic))
        startTopic = 'hermod/' + self.site + '/hotword/start'
        stopTopic = 'hermod/' + self.site + '/hotword/stop'
        audioTopic = 'hermod/' + self.site + '/microphone/audio'
        if topic == startTopic:
            self.started = True
        elif topic == stopTopic:
            self.started = False
        elif topic == audioTopic:
            self.audio_stream.write(msg.payload)

