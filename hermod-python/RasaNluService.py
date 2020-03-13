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
import paho.mqtt.client as mqtt
import warnings
import numpy as np
#import pyaudio
import soundfile
import json
import requests

from thread_handler import ThreadHandler


class RasaNluService(MqttService):

    def __init__(
            self,
            config
    ):
        super(
            RasaNluService,
            self).__init__(
                config['mqtt_hostname'],
                config['mqtt_port'],
                config['site'])
        self.config = config
        self.subscribe_to = 'hermod/' + self.site + '/nlu/parse'

    def on_message(self, client, userdata, msg):
        topic = "{}".format(msg.topic)
        #self.log("MESSAGE {}".format(topic))
        if topic == 'hermod/' + self.site + '/nlu/parse':
            URL = self.config['RasasNluService']['rasa_url'] + '/parse'
            PARAMS = {query:payload.text}
            r = requests.get(url = URL, params = PARAMS) 
            data = r.json() 
            self.log(r.code)
            self.log(data)
            #axios.post(this.props.rasaServer+"/parse",) // TODO project from payload
			
