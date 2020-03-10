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



######################################################
# This class listens for tts/say messages and triggers a sequence of messages
# that result in the text message being converted to wav audio and played through the speaker service
# Where the text is very long, it is split into parts and sent sequentially.
# The speaker service sends start and end messages. 
# This service iterates each part, waiting for each speaker/started and speaker/finished message and finally sends
# a tts/finished  message
# Depends on os pico2wav install with path in config.yaml
#########################################################


class pico2wav_tts_service(MqttService):
  
    def __init__(
            self,
            config
            ):
        super(pico2wav_tts_service, self).__init__(config['mqtt_hostname'],config['mqtt_port'],config['site'])
        self.config = config
        # subscribe to all sites
        self.subscribe_to='hermod/+/tts/say'
         
   
    def on_message(self, client, userdata, msg):
        topic = "{}".format(msg.topic)
        parts = topic.split('/')
        site = parts[1] 
        sayTopic = 'hermod/' +site+'/tts/say'
        playFinished = 'hermod/' +site+'/speaker/finished'
        payload = {}
        try:
            payload = json.loads(msg.payload)
        except:
            pass
    
        text = payload.get('text')
        
        if topic == sayTopic:
            self.generate_audio(site,msg.topic,text)
        elif topic == playFinished:
            message = {"id":payload.get('id')}
            self.client.publish('hermod/{}/tts/finished'.format(site), json.dumps(message))
            self.client.unsubscribe('hermod/{}/speaker/finished'.format(site))

    def generate_audio(self,site,topic,text): 
        self.client.publish('hermod/{}/speaker/started'.format(site), None)
        cache_path = self.config['services']['pico2wav_tts_service']['cache_path']
             
        value = randint(0, 1000000)
        fileName = os.path.join(cache_path,'tts-'+str(value)+'.wav');
        if (len(text) > 0):
            path = self.config['services']['pico2wav_tts_service']['binary_path']
            os.system(path + ' -w=' + fileName + ' "{}" '.format(text))
            
            fp = open(fileName,"rb")
            f = fp.read()
            self.client.subscribe('hermod/{}/speaker/finished'.format(site))            
            self.client.publish('hermod/{}/speaker/play/{}'.format(site,value), payload=bytes(f),qos=0)
            os.remove(fileName)
            
     



