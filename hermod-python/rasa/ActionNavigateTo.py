""" RASA action """
import sys
import logging
import asyncio    

from typing import Any, Text, Dict, List
#
from rasa_sdk import Action, Tracker
from rasa_sdk.executor import CollectingDispatcher
from rasa_sdk.events import SlotSet
from asyncio_mqtt import Client  
import os  
import json
import types

from asyncio_mqtt import Client       

CONFIG={
    'mqtt_hostname':os.environ.get('MQTT_HOSTNAME','localhost'),
    'mqtt_user':os.environ.get('MQTT_USER',''),
    'mqtt_password':os.environ.get('MQTT_PASSWORD',''),
    'mqtt_port':int(os.environ.get('MQTT_PORT','1883')) ,
}


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




async def publish(topic,payload): 
    async with AuthenticatedMqttClient(CONFIG.get('mqtt_hostname','localhost'),CONFIG.get('mqtt_port',1883),CONFIG.get('mqtt_user',''),CONFIG.get('mqtt_password','')) as client:
        await client.publish(topic,json.dumps(payload))


# dummy action when using voice interface to signal switch back to active listening
class ActionNavigateTo(Action):
#
    def name(self) -> Text:
        return "action_navigate_to"
#

    def extract_entities(self,tracker,match_entities):
        last_entities = tracker.current_state()['latest_message']['entities']
        for raw_entity in last_entities:
            if raw_entity.get('entity','') in match_entities:
                return raw_entity.get('value','')
    
    async def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        site = tracker.current_state().get('sender_id')
        # logger = logging.getLogger(__name__)    
        # logger.debug('ACTION_nav')
        search_term = self.extract_entities(tracker,['nav_target'])
        print(site)
        print(search_term)
        # # # mapping ?
        # # # home => 
        # # # crossword =>
        # # logger.debug(search_term)
        dispatcher.utter_message(text="ok")
        await publish("hermod/"+site+"/display/show",{'navigate':'/'+search_term})
        return []
        # [SlotSet("hermod_force_continue", "true"), SlotSet("hermod_force_end", None)] 
