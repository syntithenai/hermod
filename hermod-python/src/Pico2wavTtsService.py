"""
This class listens for tts/say messages and triggers a sequence of messages
that result in the text message being converted to wav audio and played through the speaker service
TODO Where the text is very long, it is split into parts and sent sequentially.
The speaker service sends start and end messages.
This service iterates each part, waiting for each speaker/started and speaker/finished message
and finally sends a tts/finished  message when all parts have finished playing
Depends on os pico2wav install with path in config.yaml
"""

import json
import os
import asyncio
from random import seed
from random import randint
from MqttService import MqttService

# seed random number generator
seed(1)


class Pico2wavTtsService(MqttService):
    """ Text to Speech Service Class """

    def __init__(
            self,
            config,
            loop
    ):
        super(
            Pico2wavTtsService,
            self).__init__(config,loop)
        self.config = config
        # subscribe to all sites
        self.subscribe_to = 'hermod/+/tts/say'

    async def on_message(self, msg):
        topic = "{}".format(msg.topic)
        parts = topic.split('/')
        site = parts[1]
        payload = {}
        try:
            payload = json.loads(msg.payload)
        except BaseException:
            pass
        #self.log('message {} {}'.format(site,topic))
        #self.log(payload)
        text = payload.get('text')
        #self.log(text)
        if topic == 'hermod/' + site + '/tts/say':
            await self.generate_audio(site, text, payload)
        elif topic == 'hermod/' + site + '/speaker/finished':
            self.log('SPEAKER FINISHED')
            self.log(payload)
            #self.play_requests[payload.get('id')] = value;
            
            message = {"id": payload.get('id')}
            await asyncio.sleep(0.5)
            await self.client.publish(
                'hermod/{}/tts/finished'.format(site),
                json.dumps(message))
            await self.client.unsubscribe('hermod/{}/speaker/finished'.format(site))

    """ Use system binary pico2wav to generate audio file from text then send audio as mqtt"""
    async def generate_audio(self, site, text, payload):
        # self.log('gen audio')
        # self.log(text)
        
        #await self.client.publish('hermod/{}/speaker/started'.format(site), None)
        cache_path = self.config['services']['Pico2wavTtsService']['cache_path']
        value = payload.get('id','no_id')
        #randint(0, 1000000)
        # if payload.get('id',False) and len(payload.get('id')) > 0:
            # self.play_requests[payload.get('id')] = value;
        file_name = os.path.join(cache_path, 'tts-' + str(value) + '.wav')
        
        if len(text) > 0:
            # text_parts = text.split(" ") 
            # # split into multiple messages
            # if len(text_parts) > 5:
                
                
            path = self.config['services']['Pico2wavTtsService']['binary_path']
            os.system(path + ' -w=' + file_name + ' "{}" '.format(text))

            file_pointer = open(file_name, "rb")
            audio_file = file_pointer.read()
            await self.client.subscribe('hermod/{}/speaker/finished'.format(site))
            await self.client.publish(
                'hermod/{}/speaker/play/{}'.format(site, value), payload=bytes(audio_file), qos=0)
            os.remove(file_name)
