import sys
import logging
import pyunsplash
import os
import json
import concurrent.futures
import asyncio    

from typing import Any, Text, Dict, List
#
from rasa_sdk import Action, Tracker
from rasa_sdk.executor import CollectingDispatcher
from rasa_sdk.events import SlotSet
from asyncio_mqtt import Client

class AuthenticatedMqttClient(Client):
    def __init__(self,hostname,port,username='',password=''):
        super(AuthenticatedMqttClient, self).__init__(hostname,port)
        self._client.username_pw_set(username, password)    
        
    # hack to include topic in yielded    
    def _cb_and_generator(self, *, log_context, queue_maxsize=0):
        # Queue to hold the incoming messages
        messages = asyncio.Queue(maxsize=queue_maxsize)
        # Callback for the underlying API
        def _put_in_queue(client, userdata, msg):
            try:
                # convert set to object
                message = types.SimpleNamespace()
                message.topic = msg.topic
                message.payload = msg.payload
                messages.put_nowait(message)
            except asyncio.QueueFull:
                MQTT_LOGGER.warning(f'[{log_context}] Message queue is full. Discarding message.')
        # The generator that we give to the caller
        async def _message_generator():
            # Forward all messages from the queue
            while True:
                yield await messages.get()
        return _put_in_queue, _message_generator()



CONFIG={
    'mqtt_hostname':os.environ.get('MQTT_HOSTNAME','localhost'),
    'mqtt_user':os.environ.get('MQTT_USER',''),
    'mqtt_password':os.environ.get('MQTT_PASSWORD',''),
    'mqtt_port':int(os.environ.get('MQTT_PORT','1883')) ,
}

async def publish(topic,payload): 
    async with AuthenticatedMqttClient(CONFIG.get('mqtt_hostname','localhost'),CONFIG.get('mqtt_port',1883),CONFIG.get('mqtt_user',''),CONFIG.get('mqtt_password','')) as client:
        await client.publish(topic,json.dumps(payload))


def search_unsplash(search_term):
    logger = logging.getLogger(__name__)    
    
    pu = pyunsplash.PyUnsplash(api_key=os.environ.get('UNSPLASH_ACCESS_KEY'))
    search = pu.search(type_='photos',page=0, per_page=4, query=str(search_term))
    images=[]
    for photo in search.entries:
            # details = pu.photo.get(photo.id,400)
            # print(photo)
            logger.debug('ACTION_ image')
            logger.debug(photo.links)
            # print(json.dumps(photo))
            # print(details.id, details.link_download)
            images.append(photo.link_download+"?auto=format")
    return images

# dummy action when using voice interface to signal switch back to active listening
class ActionShowMePicture(Action):
#
    def name(self) -> Text:
        return "action_show_me_picture"
#
    def extract_entities(self,tracker,match_entities):
        last_entities = tracker.current_state()['latest_message']['entities']
        for raw_entity in last_entities:
            if raw_entity.get('entity','') in match_entities:
                return raw_entity.get('value','')
            
    async def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        logger = logging.getLogger(__name__)    
        logger.debug('ACTION_ image')
        site = tracker.current_state().get('sender_id')
        await publish('hermod/'+site+'/tts/say',{"text":"Looking now"})
        search_term = self.extract_entities(tracker,['thing','person','place','word'])
        if search_term and len(search_term) > 0:
            executor = concurrent.futures.ProcessPoolExecutor(
                    max_workers=1,
                )
            images = await asyncio.get_event_loop().run_in_executor(executor,search_unsplash,search_term)
            if (images and len(images) > 0):
                await publish('hermod/'+site+'/display/show',{'images':images})
            else :
                await publish('hermod/'+site+'/display/show',{'images':[]})
                dispatcher.utter_message(text="I couldn't find any pictures of "+search_term)
                
            await publish('hermod/'+site+'/display/show',{'question':'Show me a picture of a '+search_term})

            
            #dispatcher.utter_message(text="Done")
        else:
            await publish('hermod/'+site+'/display/show',{'question':'Show me a picture of a '})
            dispatcher.utter_message(text="I didn't hear that right. What did you want to see a picture of?")
        return []
        #return [SlotSet("hermod_force_continue", "true"), SlotSet("hermod_force_end", None)] 
