import sys
import logging
import os  
import json
import googleapiclient.discovery
import googleapiclient.errors
 

from asyncio_mqtt import Client       
from typing import Any, Text, Dict, List
#
from rasa_sdk import Action, Tracker
from rasa_sdk.executor import CollectingDispatcher
from rasa_sdk.events import SlotSet

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


# dummy action when using voice interface to signal switch back to active listening
class ActionSearchYoutube(Action):
#
    def name(self) -> Text:
        return "action_search_youtube"
#

    def api_search(self,search_for):
        logger = logging.getLogger(__name__)    
        logger.debug('YT api '+os.environ.get('YOUTUBE_API_KEY',''))
        youtube = googleapiclient.discovery.build(
            'youtube', 'v3', developerKey=os.environ.get('YOUTUBE_API_KEY',''),cache_discovery=False)

        search_response = youtube.search().list(
            q=search_for,
            part='id', #,snippet
            maxResults=5
        ).execute()

        for search_result in search_response.get('items', []):
            logger.debug(search_result)
            if search_result['id']['kind'] == 'youtube#video':
                logger.debug("IS VIDEO "+search_result['id']['videoId'])
                return search_result['id']['videoId']

    
    
    def extract_entities(self,tracker,match_entities):
        last_entities = tracker.current_state()['latest_message']['entities']
        for raw_entity in last_entities:
            if raw_entity.get('entity','') in match_entities:
                return raw_entity.get('value','')
          
    async def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        logger = logging.getLogger(__name__)    
        logger.debug('YT')
        #await publish('hermod/'+site+'/tts/say',{"text":"Looking now"})
        site = tracker.current_state().get('sender_id')
        search_term = self.extract_entities(tracker,['thing','person','place','word'])
        logger.debug(search_term)
        #dispatcher.utter_message(text="search youtube")
        # TODO CHECK SLOT CLIENT FOR CAPABILITIES AND REPLY APPROPRIATELY
        #https://www.youtube.com/results?search_query=juggling
        if search_term and len(search_term) > 0:
            videoId = self.api_search(search_term)
            await publish('hermod/'+site+'/display/show',{'question':'Search youtube for '+str(search_term)})
            await publish('hermod/'+site+'/display/show',{'youtube':videoId})
            # dispatcher.utter_message(text="Done")
        else:
            dispatcher.utter_message(text="I didn't hear that right.  What did you want to search youtube for ?")
        # await publish('hermod/'+site+'/display/show',{'question':'Remember that the '+attribute+' of '+thing+' is '+answer})
        # await publish('hermod/'+site+'/display/show',{'buttons':[{"label":'Yes please',"text":'yes please'},{"label":'No thanks',"text":'No thanks'}]})      
        # await publish('hermod/'+site+'/display/show',{'question':'Spell the word '+word})dispatcher.utter_message(text="The "+attribute+" of "+thing+" is "+ result)
        
        
        return []
        #SlotSet("hermod_force_continue", "true"), SlotSet("hermod_force_end", None)] 
