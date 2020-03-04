import json
import time
import os
import pyaudio
import wave
import io

from random import seed
from random import randint
# seed random number generator
seed(1)

from mqtt_service import MqttService

# # apt-get install sox libsox-fmt-all ????

class pico2wav_tts_service(MqttService):
  
    def __init__(
            self,
            config
            ):
        super(pico2wav_tts_service, self).__init__(config['mqtt_hostname'],config['mqtt_port'],config['site'])
        self.config = config
        self.site = config['site']
        self.subscribe_to='hermod/'+self.site+'/tts/say'
    
     
   
    def on_message(self, client, userdata, msg):
        self.log('ONMESS')
        topic = "{}".format(msg.topic)
        self.log("ssMESSAGE {}".format(topic))
        playTopic = 'hermod/' +self.site+'/tts/say'
        if topic == playTopic:
            self.generate_audio(msg.topic,msg.payload)
        elif topic == playFinished:
            
            # TODO - pass id
            self.client.publish('hermod/{}/tts/finished'.format(site), json.dumps({'id':msg.payload.id}))
            self.client.unsubscribe('hermod/{}/speaker/finished'.format(site))
     
    # TODO, FILE BASED CACHE FOR GENERATED UTTERANCES    
    def generate_audio(topic,payload): 
        self.client.publish('hermod/{}/speaker/started'.format(site), None)
        endPart = topic[:7]
        site = endPart[8:]
        print("MESSAGE OK: {}".format(site))
        #sessionId = payload.get('id')
       # siteId = payload.get('siteId','default')
        #lang = payload.get('lang','en-GB')
        
        value = randint(0, 1000000)
        fileName = '/tmp/tts-'+value+'.wav'
        
        if (len(payload.text) > 0):
            os.system('/usr/bin/pico2wave -w=' + fileName + ' "{}" '.format(payload.get('text')))
            fp = open(fileName)
            f = fp.read()
            self.client.publish('hermod/{}/speaker/play/{}'.format(site,value), payload=bytes(f),qos=0)
            os.remove(fileName)
            self.client.subscribe('hermod/{}/speaker/finished'.format(site))
            
        

# #!/opt/rasa/anaconda/bin/python
# # -*-: coding utf-8 -*-
# """ Snips core and nlu server. """
# from __future__ import absolute_import
# from __future__ import division
# from __future__ import print_function
# from __future__ import unicode_literals

# import json
# import time
# import os

# from socket import error as socket_error

# from SnipsMqttServer import SnipsMqttServer

# import paho.mqtt.client as mqtt

# from thread_handler import ThreadHandler
# import sys,warnings
# # apt-get install sox libsox-fmt-all
# import sox

# class SnipsTTSServer(SnipsMqttServer):
    
    # def __init__(self,
                 # mqtt_hostname='mosquitto',
                 # mqtt_port=1883,
                 # ):
        # SnipsMqttServer.__init__(self,mqtt_hostname,mqtt_port)
        # self.subscribe_to='hermes/tts/say'

    # def on_message(self, client, userdata, msg):
        # #print("MESSAGEtts: {}".format(msg.topic))
            
        # if msg.topic is not None and msg.topic=="hermes/tts/say":
            # print("MESSAGE OK: {}".format(msg.topic))
            # payload = json.loads(msg.payload)
            # # .decode('utf-8')
            # sessionId = payload.get('sessionId')
            # siteId = payload.get('siteId','default')
            # lang = payload.get('lang','en-GB')
            # theId = sessionId
            # fileName = '/tmp/speaking.wav'
            
            # os.system('/usr/bin/pico2wave -w=' + fileName + ' "{}" '.format(payload.get('text')))
            # #pubCommand = "mosquitto_pub -h " +self.mqtt_hostname+" -t 'hermes/audioServer/default/playBytes/0049a91e-8449-4398-9752-07c858234' -f '" + fileName + "'"
            # #print(pubCommand)
            # #os.system(pubCommand)
            
            # fp = open(fileName)
            # f = fp.read()
            # topic = 'hermes/audioServer/{}/playBytes'.format(siteId)
            # if theId is not None:
                # topic = topic + '/{}'.format(theId[::-1])
            # self.client.publish(topic, payload=bytes(f),qos=0)
            # #print("PUBLISHED on " + topic)
            # os.remove(fileName)

       
# server = SnipsTTSServer()
# server.start()







