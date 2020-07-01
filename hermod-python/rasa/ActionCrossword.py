import sys
import logging

from typing import Any, Text, Dict, List
#
from rasa_sdk import Action, Tracker
from rasa_sdk.executor import CollectingDispatcher
from rasa_sdk.events import SlotSet
from word2number import w2n
import motor
import motor.motor_asyncio
from bson.objectid import ObjectId
import json

import os
import types        
import asyncio
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



def mongo_connect(collection):
    # logger = logging.getLogger(__name__)
    # logger.debug('MONGO CONNECT ')
    # logger.debug(str(os.environ.get('MONGO_CONNECTION_STRING')))
    
    client = motor.motor_asyncio.AsyncIOMotorClient(os.environ.get('MONGO_CONNECTION_STRING'))

    db = client['hermod']
    collection = db[collection]
    return collection


      
async def get_crossword(uid):
    print('CROSSWORD')
    print(uid)
    if uid:
        # crosswordId = None #request.getid
        # print([crosswordId])
        try:
            # print('FIND FACT conn')
            
            collection = mongo_connect('crosswords') 
            print('FIND FACT CONNECTED')
            query = {'_id':ObjectId(uid)}
            # print(query)
            document = await collection.find_one(query)
            # crosswords = []
            # async for document in collection.find(query):
                # print(document)
                # crosswords.append(document)
            # #document = await collection.find_many(query)
            # print(document)
            document['_id'] = str(document.get('_id'))
            return document
        except:
            print('FIND FACT ERR')
            e = sys.exc_info()
            print(e)  
  


# dummy action when using voice interface to signal switch back to active listening
class ActionFillCrossword(Action):
#
    def name(self) -> Text:
        return "action_fill_crossword"
#
    def extract_entities(self,tracker,match_entities):
        last_entities = tracker.current_state()['latest_message']['entities']
        for raw_entity in last_entities:
            if raw_entity.get('entity','') in match_entities:
                return raw_entity.get('value','')

    async def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        try:
            site = tracker.current_state().get('sender_id')
            # dispatcher.utter_message(text="crossword")
            slots = tracker.current_state().get('slots')
            slotsets = []
            if slots.get('crossword'):
                crossword = await  get_crossword(slots.get('crossword'))
                if crossword:
                    crossword_position = self.extract_entities(tracker,['crossword_position'])
                    word = self.extract_entities(tracker,['word','thing','person','place',])
                    if crossword_position :
                        just_number = None
                        clean_number = crossword_position.replace('across','').replace('down','')
                        parts = clean_number.split(' ')
                        clean_number = parts[0]
                        # integer from text
                        if clean_number.isdigit() > 0 and int(clean_number) > 0:
                            just_number = clean_number.strip()
                        # convert number from text
                        else:
                            try:
                                just_number = w2n.word_to_num(clean_number)
                            except:
                                pass
                        # print(just_number)
                        direction = None
                        if "across" in crossword_position:
                                direction = "across"
                        elif "down" in crossword_position:
                                direction = "down"
                                
                        if just_number:
                            if direction:
                                if word:
                                    # print(crossword.get('data',{}))
                                    answer = crossword.get('data',{}).get(direction,{}).get(str(just_number)).get('answer','').lower().strip().replace(' ','')
                                    # print([word,answer])
                                    if word.lower().strip().replace(' ','') == answer:
                                        dispatcher.utter_message(text="Correct")
                                        # print(['  CROSSWORD   ',answer,crossword_position,just_number,word])
                                        await publish('hermod/'+site+'/crossword/fill',{'direction':direction, "word":word.strip().replace(' ',''), "number":just_number})
                                        slotsets.append(SlotSet("hermod_force_continue", None))
                                        slotsets.append(SlotSet("hermod_force_end", "true")) 
                                        
                                    else :
                                        dispatcher.utter_message(text="Nope, try again")
                                        slotsets.append(SlotSet("hermod_force_continue", "true"))
                                        slotsets.append(SlotSet("hermod_force_end", None)) 
                                else: 
                                    dispatcher.utter_message(text="I didn't hear the word you wanted to fill")
                                    slotsets.append(SlotSet("hermod_force_continue", "true"))
                                    slotsets.append(SlotSet("hermod_force_end", None)) 
                            else:
                                dispatcher.utter_message(text="I didn't hear which direction you wanted to fill")
                                slotsets.append(SlotSet("hermod_force_continue", "true"))
                                slotsets.append(SlotSet("hermod_force_end", None)) 
                        else: 
                            dispatcher.utter_message(text="I didn't hear the number you wanted to fill")
                            slotsets.append(SlotSet("hermod_force_continue", "true"))
                            slotsets.append(SlotSet("hermod_force_end", None)) 

                    else:
                        dispatcher.utter_message(text="I didn't hear the position you wanted to fill")
                        slotsets.append(SlotSet("hermod_force_continue", "true"))
                        slotsets.append(SlotSet("hermod_force_end", None)) 
            
            #hermod/+/crossword/fill
        except Exception as e:
            print('ERROR')
            print(e)
        return slotsets
        # [SlotSet("hermod_force_continue", "true"), SlotSet("hermod_force_end", None)] 
