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
        # self.log('start constr')
        super(pico2wav_tts_service, self).__init__(config['mqtt_hostname'],config['mqtt_port'],config['site'])
        self.config = config
        # subscribe to all sites
        #self.site = None
        self.subscribe_to='hermod/+/tts/say'
        # self.log('end constr')
    
    # def sft(topic):
        # self.log('SFT'.format(topic))
        # return 'jest'
        # # parts = [] 
        # # #topic.split('/')
        # # self.log('SFT parts'.format(parts))
        # # return parts[1];
     
   
    def on_message(self, client, userdata, msg):
        topic = "{}".format(msg.topic)
        parts = topic.split('/')
        site = parts[1] 
        #site = self.sft(topic)
        sayTopic = 'hermod/' +site+'/tts/say'
        playFinished = 'hermod/' +site+'/speaker/finished'
        
        #sayTopic="{}".format(st)
        self.log('ONMESS from {} - {}'.format(site, topic))
        self.log(playFinished)
        self.log(topic)
       # 
       
        self.log("ttMESSAGE |{}|".format(topic))
        payload = json.loads(msg.payload)
        self.log(payload['text'])
        if payload is not None :
            text = payload['text']
        #self.log('text {}'.format(text))
        if topic == sayTopic:
            # self.log('genaudio {}'.format(text))
            self.generate_audio(site,msg.topic,text)
        elif topic == playFinished:
            self.log('yAY ALL DONE' )
            # TODO - pass id
            self.client.publish('hermod/{}/tts/finished'.format(site), json.dumps({'id':msg.payload.id}))
            self.client.unsubscribe('hermod/{}/speaker/finished'.format(site))
     
    # TODO, FILE BASED CACHE FOR GENERATED UTTERANCES    
    def generate_audio(self,site,topic,text): 
        self.client.publish('hermod/{}/speaker/started'.format(site), None)
        cache_path = self.config['services']['pico2wav_tts_service']['cache_path']
             
        value = randint(0, 1000000)
        fileName = os.path.join(cache_path,'tts-'+str(value)+'.wav');
        if (len(text) > 0):
            path = self.config['services']['pico2wav_tts_service']['binary_path']
            os.system(path + ' -w=' + fileName + ' "{}" '.format(text))
            
            fp = open(fileName,"rb")
            self.log('open {}'.format(fileName))
            # if (fp.mode == 'r'):
                # self.log('opened {}'.format(fileName))
            # self.log('FP {}'.format(fp))
            # try:
            f = fp.read()
            # except Exception as e: 
                # self.log("Unexpected error:")
                # self.log(e)
                
            # self.log('read {}')
             # self.log('PICO2WAV PATH')
            # self.log(path)
            self.client.subscribe('hermod/{}/speaker/finished'.format(site))
            
            self.client.publish('hermod/{}/speaker/play/{}'.format(site,value), payload=bytes(f),qos=0)
           # os.remove(fileName)
            
     



