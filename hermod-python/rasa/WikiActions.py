import asyncio
import inflect
import sys
import logging
import json
import os
import yaml

from socket import error as socket_error        
from typing import Any, Text, Dict, List
#
import concurrent.futures
from rasa_sdk import Action, Tracker
from rasa_sdk.executor import CollectingDispatcher
from rasa_sdk.events import SlotSet, FollowupAction

from mediawiki import MediaWiki
from wikidata.client import Client
import requests        
import wptools        
import paho.mqtt.client as mqtt
import motor
import motor.motor_asyncio

import types
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
                message.payload = msg.payload;
                messages.put_nowait(message)
            except asyncio.QueueFull:
                MQTT_LOGGER.warning(f'[{log_context}] Message queue is full. Discarding message.')
        # The generator that we give to the caller
        async def _message_generator():
            # Forward all messages from the queue
            while True:
                yield await messages.get()
        return _put_in_queue, _message_generator()


# config from main source. will need to be updated if action server is hosted elsewhere        
# F = open(os.path.join(os.path.dirname(__file__), '../src/config-all.yaml'), "r")
# CONFIG = yaml.load(F.read(), Loader=yaml.FullLoader)
CONFIG={
    'mqtt_hostname':os.environ.get('MQTT_HOSTNAME','localhost'),
    'mqtt_user':os.environ.get('MQTT_USER',''),
    'mqtt_password':os.environ.get('MQTT_PASSWORD',''),
    'mqtt_port':int(os.environ.get('MQTT_PORT','1883')) ,
}

async def publish(topic,payload): 
    logger = logging.getLogger(__name__) 
    
    # logger.debug(os.environ)
    # logger.debug(CONFIG)
    
    async with AuthenticatedMqttClient(CONFIG.get('mqtt_hostname','localhost'),CONFIG.get('mqtt_port',1883),CONFIG.get('mqtt_user',''),CONFIG.get('mqtt_password','')) as client:
    # client = mqtt.Client()
    # client.username_pw_set(CONFIG.get('mqtt_user'), CONFIG.get('mqtt_password'))
    # client.connect(CONFIG.get('mqtt_hostname'), CONFIG.get('mqtt_port'), 60)
    # client.username_pw_set('hermod_server','hermod')
    # client.connect("localhost", 1883, 60)
        await client.publish(topic,json.dumps(payload))

##
# WIKIPEDIA FUNCTIONS
##

# text search wikipedia link  
# https://en.wikipedia.org/w/index.php?search=Grey+Geese&title=Special%3ASearch&fulltext=1&ns0=1

WIKIDATA_ATTRIBUTES = {
    "person": {
        "P31":"instance of",
        #person
        "P106":"occupation",
        "P27":"country of citizenship",
        "P19":"place of birth",
        "P1569":"date of birth",
        "P570":"place of death",
        "P26":"spouse",
        "P140":"religion",
        "P21":"sex or gender",
        "P106":"occupation"
    },
    "place": {
        "P31":"instance of",
        # place
        "P36":"capital",
        "P1451":"motto text",
        "P474":"country calling code",
        "P1082":"population",
        "P38":"currency",
        "P1906":"office held by head of state",
        "P37":"official language",
        "P30":"continent"
    }
}


def lookup_wiktionary(word):
    logger = logging.getLogger(__name__)    
    try:
        wikipedia = MediaWiki()
        wikipedia.set_api_url('https://en.wiktionary.org/w/api.php')
        matches = {}
        search_results = wikipedia.opensearch(word)
        if len(search_results) > 0:
            page_title = search_results[0][0]
            page = wikipedia.page(page_title)
            parts = page.content.split("\n")
            i = 0
            while i < len(parts):
                definition = ""
                part = parts[i].strip()
                
                if part.startswith("=== Verb ===") or part.startswith("=== Noun ===") or part.startswith("=== Adjective ==="):
                    #print(part)
                    # try to skip the first two lines after the marker
                    if (i + 1) < len(parts): 
                        definition  = parts[i+1]
                    if (i + 2) < len(parts) and len(parts[i+2].strip()) > 0: 
                        definition  = parts[i+2]
                    if (i + 3) < len(parts) and len(parts[i+3].strip()) > 0: 
                        definition  = parts[i+3]
                
                
                if part.startswith("=== Adjective ===") and not 'adjective' in matches:
                    matches['adjective'] = definition
                if part.startswith("=== Noun ===") and not 'noun' in matches:
                    matches['noun'] = definition
                if part.startswith("=== Verb ===") and not 'verb' in matches:
                    matches['verb'] = definition
                    
                i = i + 1
            final = ""
            
            # prefer verb, noun then adjective
            if matches.get('adjective',False):
                final = matches.get('adjective')
            if matches.get('noun',False):
                final = matches.get('noun')
            if matches.get('verb',False):
                final = matches.get('verb')
            # strip leading bracket comment
            if final[0] == '(':
                close = final.index(")") + 1
                final = final[close:]
            matches['definition'] = final
        return matches
    except:
        e = sys.exc_info()
        logger.debug(e)


def lookup_wikipedia(word):
    logger = logging.getLogger(__name__)  
    try:
        wikipedia = MediaWiki()
        #wikipedia.set_api_url('https://en.wikpedia.org/w/api.php')
        summary = ''
        search_results = wikipedia.opensearch(word)
        if len(search_results) > 0:
            page_title = search_results[0][0]
            page = wikipedia.page(page_title)
            parts = page.summary.split('. ')
            summary = parts[0];
        return summary
    except:
        e = sys.exc_info()
        logger.debug(e)

def lookup_wikidata(attribute,thing):
    logger = logging.getLogger(__name__)    
    try:
        # logger.debug(['lookup',attribute,thing]) 
        wikidata_id = lookup_wikidata_id(thing)
        # client = Client()  # doctest: +SKIP
        # entity = client.get(wikidata_id, load=True)
        #logger.debug(json.dumps(entity))
        page = wptools.page(wikibase=wikidata_id)
        page.wanted_labels(list(WIKIDATA_ATTRIBUTES.get('person').keys()) + list(WIKIDATA_ATTRIBUTES.get('place').keys()))
        page.get_wikidata()
        facts = page.data['wikidata']
        clean_facts = {}
        for fact in facts:
            clean_key = strip_after_bracket(fact).lower().strip()
            # convert to single string, different types of facts - string, list, list of objects
            if type(facts[fact]) == str:
                # simple case string fact
                clean_facts[clean_key] = strip_after_bracket(facts[fact])
            elif type(facts[fact]) == list:
                # assume all list elements same type, decide based on first
                if len(facts[fact]) > 0:
                    if type(facts[fact][0]) == str:
                        # join first five with commas
                        max_list_facts=5
                        # only use the first listed capital 
                        if clean_key == "capital" or clean_key == "continent":
                            max_list_facts=1
                        
                        i = 0
                        joined_facts = []
                        for fact_item in facts[fact]:
                            if i < max_list_facts:
                                joined_facts.append(strip_after_bracket(fact_item))
                            else:
                                break
                            i = i+1
                                                        
                        clean_facts[clean_key] = ", ".join(joined_facts)
                            
                    elif type(facts[fact][0]) == dict:
                        # if list object has amount attribute, use amount from first list item
                        if 'amount' in facts[fact][0]:
                            clean_facts[clean_key] = facts[fact][0].get('amount','')
                        
        
        # logger.debug(clean_facts)  
          
        if attribute.lower() in clean_facts:
            return clean_facts[attribute.lower()]
        return ""
    except:
        e = sys.exc_info()
        logger.debug(e)

def lookup_wikidata_id(thing):
    logger = logging.getLogger(__name__)
    try:
        API_ENDPOINT = "https://www.wikidata.org/w/api.php"
        params = {'action': 'wbsearchentities','format': 'json','language': 'en','search': thing}
        r = requests.get(API_ENDPOINT, params = params)
        results = r.json()['search']
        #print(results)
        final = None
        if len(results) > 0:
            final = r.json()['search'][0].get('id',None)
        return final
    except:
        e = sys.exc_info()
        logger.debug(e)
    
def strip_after_bracket(text):
    parts = text.split("(")
    return parts[0]
        
async def send_to_wikipedia(word,site):
    logger = logging.getLogger(__name__)
    try:
        # lookup in wiktionary and send display message
        wikipedia = MediaWiki()
        wikipedia.set_api_url('https://en.wiktionary.org/w/api.php')
        matches = {}
        search_results = wikipedia.opensearch(word)
        # logger.debug(search_results)
        
        if len(search_results) > 0:
            page_title = search_results[0][0]
            page_link = search_results[0][2]
            # page = wikipedia.page(page_title)
            # parts = page.content.split("\n")
            # logger.debug([page_title,page_link])
            await publish('hermod/'+site+'/display/show',{'frame':page_link})
    except:
        e = sys.exc_info()
        logger.debug(e)
    

## DATABASE FUNCTIONS


def mongo_connect():
    logger = logging.getLogger(__name__)
    logger.debug('MONGO CONNECT ')
    logger.debug(str(os.environ.get('MONGO_CONNECTION_STRING')))
    
    client = motor.motor_asyncio.AsyncIOMotorClient(os.environ.get('MONGO_CONNECTION_STRING'))

    db = client['hermod']
    collection = db['wikifacts']
    return collection

async def save_fact(attribute,thing,answer):
    logger = logging.getLogger(__name__)
    logger.debug('SAVE FACT')
    logger.debug([attribute,thing,answer])
    try:
        if attribute and thing and answer: 
            collection = mongo_connect() 
            logger.debug('SAVE FACT CONNECTED')
            document = {'attribute': attribute,'thing':thing,'answer':answer}
            result = await collection.insert_one(document)
            logger.debug('result %s' % repr(result.inserted_id))
    except:
        logger.debug('SAVE FACT ERR')
        e = sys.exc_info()
        logger.debug(e)
        

async def find_fact(attribute,thing):
    logger = logging.getLogger(__name__)
    logger.debug('FIND FACT')
    logger.debug([attribute,thing])
    try:
        logger.debug('FIND FACT conn')
        
        collection = mongo_connect() 
        logger.debug('FIND FACT CONNECTED')
        query = {'$and':[{'attribute':attribute},{'thing':thing}]}
        logger.debug(query)
        document = await collection.find_one(query)
        logger.debug(document)
        if document:
            return document.get('answer',None)
    except:
        logger.debug('FIND FACT ERR')
        e = sys.exc_info()
        logger.debug(e)
    
# async def do_find():
    # collection = mongo_connect() 
    # cursor = collection.find({})
    # # Modify the query before iterating
    # #cursor.sort('i', -1).skip(1).limit(2)
    # async for document in cursor:
        # print(document)


class ActionSearchWiktionary(Action):
#
    def name(self) -> Text:
        return "action_search_wiktionary"
#
    async def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        logger = logging.getLogger(__name__)    
        # logger.debug('DEFINE ACTION')
        #logger.debug(CONFIG)
        # logger.debug(tracker.current_state())
        last_entities = tracker.current_state()['latest_message']['entities']
        site = tracker.current_state().get('sender_id')
        word = ''
        for raw_entity in last_entities:
            # logger.debug(raw_entity)
            if raw_entity.get('entity','') == "word":
                word = raw_entity.get('value','')
        
        slotsets = []
        if len(word) > 0:
            cached_fact = await find_fact('definition',word.lower())
            if cached_fact:
                await publish('hermod/'+site+'/display/show',{'buttons':[{"label":'Etymology',"frame":'https://en.wiktionary.org/wiki/'+word+'#Etymology'}]})
                await publish('hermod/'+site+'/display/show',{'frame':'https://en.wiktionary.org/wiki/'+word})
                dispatcher.utter_message(text="The meaning of "+word+" is "+ cached_fact)
            else:   
                #dispatcher.utter_message(text=)
                await publish('hermod/'+site+'/tts/say',{"text":"Looking now"})
                await publish('hermod/'+site+'/display/startwaiting',{})
                slotsets.append(SlotSet('word',word))
                loop = asyncio.get_event_loop()
                result = await loop.run_in_executor(None,lookup_wiktionary,word)

                #result = lookup_wiktionary(word)
                if result and len(result.get('definition','')) > 0:
                    await save_fact('definition',word.lower(),result.get('definition',''))
                    #{"label":'date',"text":'what is the date'},{"label":'time',"nlu":'ask_time'}, 
                    await publish('hermod/'+site+'/display/show',{'buttons':[{"label":'Etymology',"frame":'https://en.wiktionary.org/wiki/'+word+'#Etymology'}]})
                    await publish('hermod/'+site+'/display/show',{'frame':'https://en.wiktionary.org/wiki/'+word})
                    dispatcher.utter_message(text="The meaning of "+word+" is "+ result.get('definition',''))
                    slotsets.append(FollowupAction('action_end'))  
                    # TODO send hermod/XX/display/url   
                else:
                    dispatcher.utter_message(text="I can't find the word "+word)
                    slotsets.append(FollowupAction('action_end'))  
            await publish('hermod/'+site+'/display/stopwaiting',{})
        else:
            dispatcher.utter_message(text="I didn't hear the word you want defined. Try again")
        
        
        return slotsets
        
        

        
        
#
class ActionSearchWikipedia(Action):

    def name(self) -> Text:
        return "action_search_wikipedia"
#
    async def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        logger = logging.getLogger(__name__)    
        # logger.debug('DEFINE ACTION')
        # logger.debug(tracker.current_state())
        last_entities = tracker.current_state()['latest_message']['entities']
        word = ''
        slotsets = []
        for raw_entity in last_entities:
            logger.debug(raw_entity)
            if raw_entity.get('entity','') == "thing":
                word = raw_entity.get('value','')
                slotsets.append(SlotSet('thing',word))
            if raw_entity.get('entity','') == "place":
                word = raw_entity.get('value','')
                slotsets.append(SlotSet('place',word))
            if raw_entity.get('entity','') == "person":
                word = raw_entity.get('value','')
                slotsets.append(SlotSet('person',word))
        site = tracker.current_state().get('sender_id')        
        if word and len(word) > 0:
            cached_fact = await find_fact('summary',word.lower())
            if cached_fact:
                await publish('hermod/'+site+'/display/show',{'frame':'https://en.wikipedia.org/wiki/'+word})
                dispatcher.utter_message(text=word + ". " + cached_fact)
                slotsets.append(FollowupAction('action_end'))  
        
            else:   
                await publish('hermod/'+site+'/tts/say',{"text":"Looking now"})
                await publish('hermod/'+site+'/display/startwaiting',{})
                loop = asyncio.get_event_loop()
                result = await loop.run_in_executor(None,lookup_wikipedia,word)
                #result = lookup_wikipedia(word)
                if result and len(result) > 0:
                    await save_fact('summary',word.lower(),result)
                    await publish('hermod/'+site+'/display/show',{'frame':'https://en.wikipedia.org/wiki/'+word})
                    dispatcher.utter_message(text=word + ". " + result)
                    slotsets.append(FollowupAction('action_end'))  
                else:
                    await publish('hermod/'+site+'/display/show',{'frame':'https://en.wikipedia.org/wiki/'+word})
                    dispatcher.utter_message(text="I can't find the topic "+word)
                    slotsets.append(FollowupAction('action_end'))  
                
        else:
            dispatcher.utter_message(text="I didn't hear your question. Try again")
        await publish('hermod/'+site+'/display/stopwaiting',{})
        
        return slotsets
        
        
    # class ActionSearchWikipediaPerson(ActionSearchWikipedia):
        # def name(self) -> Text:
            # return "action_search_wikipedia_person"
        
    # class ActionSearchWikipediaPlace(ActionSearchWikipedia):
        # def name(self) -> Text:
            # return "action_search_wikipedia_place"
class ActionSearchWikipediaMore(Action):

    def name(self) -> Text:
        return "action_tell_me_more"
#
    async def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        logger = logging.getLogger(__name__)    
        # logger.debug('DEFINE ACTION')
        # logger.debug(tracker.current_state())
        last_entities = tracker.current_state()['latest_message']['entities']
        word = ''
        slotsets = []
        for raw_entity in last_entities:
            logger.debug(raw_entity)
            if raw_entity.get('entity','') == "thing":
                word = raw_entity.get('value','')
                slotsets.append(SlotSet('thing',word))
            if raw_entity.get('entity','') == "place":
                word = raw_entity.get('value','')
                slotsets.append(SlotSet('place',word))
            if raw_entity.get('entity','') == "person":
                word = raw_entity.get('value','')
                slotsets.append(SlotSet('person',word))
        site = tracker.current_state().get('sender_id')        
        if word and len(word) > 0:
            cached_fact = await find_fact('summary',word.lower())
            if cached_fact:
                await publish('hermod/'+site+'/display/show',{'frame':'https://en.wikipedia.org/wiki/'+word})
                dispatcher.utter_message(text=word + ". " + cached_fact)
                slotsets.append(FollowupAction('action_end'))  
        
            else:   
                await publish('hermod/'+site+'/tts/say',{"text":"Looking now"})
                await publish('hermod/'+site+'/display/startwaiting',{})
                loop = asyncio.get_event_loop()
                result = await loop.run_in_executor(None,lookup_wikipedia,word)
                #result = lookup_wikipedia(word)
                if result and len(result) > 0:
                    await save_fact('summary',word.lower(),result)
                    await publish('hermod/'+site+'/display/show',{'frame':'https://en.wikipedia.org/wiki/'+word})
                    dispatcher.utter_message(text=word + ". " + result)
                    slotsets.append(FollowupAction('action_end'))  
                else:
                    await publish('hermod/'+site+'/display/show',{'frame':'https://en.wikipedia.org/wiki/'+word})
                    dispatcher.utter_message(text="I can't find the topic "+word)
                    slotsets.append(FollowupAction('action_end'))  
                
        else:
            dispatcher.utter_message(text="I didn't hear your question. Try again")
        await publish('hermod/'+site+'/display/stopwaiting',{})
        
        return slotsets


class ActionSearchWikidata(Action):
    
#
    def name(self) -> Text:
        return "action_search_wikidata"
#
    async def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        logger = logging.getLogger(__name__)    
        # logger.debug('DEFINE ACTION')
        # logger.debug(tracker.current_state())
        last_entities = tracker.current_state()['latest_message']['entities']
        attribute = ''
        thing = ''
        slotsets = []
        # TODO - also slots to be considered 
        # logger.debug('SLOTS')
        # logger.debug(tracker.current_state())
        # pull parameters from saved slots ?
        slots = tracker.current_state().get('slots')
        for slot in slots:
            if slot == "thing" or  slot == "person" or  slot == "place":
                logger.debug('SET FROM SLOT '+str(slot)+' ' +str(slots[slot]))
                thing = slots[slot]
            if slot == "attribute" :
                logger.debug('SET FROM SLOT '+str(slot)+' ' +str(slots[slot]))
                attribute = slots[slot]
                
        for raw_entity in last_entities:
            # logger.debug(raw_entity)
            if raw_entity.get('entity','') == "attribute":
                attribute = raw_entity.get('value','')
                slotsets.append(SlotSet('attribute',attribute))
            if raw_entity.get('entity','') == "thing":
                thing = raw_entity.get('value','')
                slotsets.append(SlotSet('thing',thing))
            if raw_entity.get('entity','') == "place":
                thing = raw_entity.get('value','')
                slotsets.append(SlotSet('place',thing))
            if raw_entity.get('entity','') == "person":
                thing = raw_entity.get('value','')
                slotsets.append(SlotSet('person',thing))
            
        
                
        site = tracker.current_state().get('sender_id')        
        if attribute and thing and len(attribute) > 0 and len(thing) > 0:
            cached_fact = await find_fact(attribute.lower(),thing.lower())
            if cached_fact:
                await publish('hermod/'+site+'/display/show',{'frame':'https://en.wikipedia.org/wiki/'+thing})
                dispatcher.utter_message(text="The "+attribute+" of "+thing+" is "+ cached_fact)
            else:     
                await publish('hermod/'+site+'/tts/say',{"text":"Looking now"})
                await publish('hermod/'+site+'/display/startwaiting',{})
                loop = asyncio.get_event_loop()
                result = await loop.run_in_executor(None,lookup_wikidata,attribute,thing)
                
                #result = lookup_wikidata(attribute,thing)
                if result and len(result) > 0:
                    # convert to spoken numbers
                    if attribute=="population":
                        p = inflect.engine()
                        result = p.number_to_words(result)
                    await save_fact(attribute.lower(),thing.lower(),result)
                    await publish('hermod/'+site+'/display/show',{'frame':'https://en.wikipedia.org/wiki/'+thing})
                    dispatcher.utter_message(text="The "+attribute+" of "+thing+" is "+ result)
                    # TODO send hermod/XX/display/url  {'url':'https://en.wiktionary.org/wiki/'+word} 
                    
                else:
                    await publish('hermod/'+site+'/display/show',{'frame':'https://en.wikipedia.org/wiki/'+thing})
                    dispatcher.utter_message(text="I don't know the "+attribute+" of "+thing)
            slotsets.append(FollowupAction('action_end'))  
        
        elif attribute  and len(attribute) > 0:
            dispatcher.utter_message(text="I didn't hear your question. Try again")
        elif  thing and len(thing) > 0:
            await publish('hermod/'+site+'/display/show',{'frame':'https://en.wikipedia.org/wiki/'+thing})
            result = lookup_wikipedia(thing)
            if result and len(result) > 0:
                dispatcher.utter_message(text=thing + ". " + result)
            else:
                dispatcher.utter_message(text="I can't find the topic "+thing)
            slotsets.append(FollowupAction('action_end'))  
        else:
            dispatcher.utter_message(text="I didn't hear your question. Try again")
        await publish('hermod/'+site+'/display/stopwaiting',{})
        return slotsets

        
# class ActionSearchWikidataPerson(ActionSearchWikidata):
    # def name(self) -> Text:
        # return "action_search_wikidata_person"
    
# class ActionSearchWikidataPlace(ActionSearchWikidata):
    # def name(self) -> Text:
        # return "action_search_wikidata_place"
        
# class ActionSearchWikidataFollowup(ActionSearchWikidata):
    # def name(self) -> Text:
        # return "action_search_wikidata_followup"


class ActionConfirmSaveFact(Action):
    
#
    def name(self) -> Text:
        return "action_confirm_save_fact"
#
    async def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        logger = logging.getLogger(__name__) 
        last_entities = tracker.current_state()['latest_message']['entities']
        attribute = ''
        thing = ''
        answer = ''
        slotsets = []
        
        # only interested in entities from the last utterance        
        for raw_entity in last_entities:
            # logger.debug(raw_entity)
            if raw_entity.get('entity','') == "attribute":
                attribute = raw_entity.get('value','')
                slotsets.append(SlotSet('attribute',attribute))
            if raw_entity.get('entity','') == "answer":
                answer = raw_entity.get('value','')
                slotsets.append(SlotSet('answer',answer))
            if raw_entity.get('entity','') == "thing":
                thing = raw_entity.get('value','')
                slotsets.append(SlotSet('thing',thing))
            if raw_entity.get('entity','') == "place":
                thing = raw_entity.get('value','')
                slotsets.append(SlotSet('place',thing))
            if raw_entity.get('entity','') == "person":
                thing = raw_entity.get('value','')
                slotsets.append(SlotSet('person',thing))
            
        
                
        if attribute and thing and len(attribute) > 0 and len(thing) > 0 and answer and and len(answer) > 0:
            dispatcher.utter_message(text="Do you want me to remember that the "+attribute+" of "+thing+" is "+answer)
        else 
            dispatcher.utter_message(text="Can't save because I'm missing information")
        return slotsets
        
class ActionSaveFact(Action):
#
    def name(self) -> Text:
        return "action_save_fact"
#
    async def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        logger = logging.getLogger(__name__) 
        slots = tracker.current_state().get('slots')
        slotsets = []
        thing=''
        answer=''
        attribute=''
        for slot in slots:
            if slot == "thing" or  slot == "person" or  slot == "place":
                logger.debug('SET FROM SLOT '+str(slot)+' ' +str(slots[slot]))
                thing = slots[slot]
            if slot == "attribute" :
                logger.debug('SET FROM SLOT '+str(slot)+' ' +str(slots[slot]))
                attribute = slots[slot]
            if slot == "answer" :
                logger.debug('SET FROM SLOT '+str(slot)+' ' +str(slots[slot]))
                answer = slots[slot]
        if attribute and thing and len(attribute) > 0 and len(thing) > 0 and answer and and len(answer) > 0:
            dispatcher.utter_message(text="Saved")
        else 
            dispatcher.utter_message(text="Can't save because I'm missing information")
        return slotsets


class ActionSpellWord(Action):
    def name(self) -> Text:
        return "action_spell_word"
    
    async def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        # logger = logging.getLogger(__name__)    
        # logger.debug('SPELL WORD')
        last_entities = tracker.current_state()['latest_message']['entities']
        # logger.debug(last_entities)
        word = ''
        slotsets = []
        site = tracker.current_state().get('sender_id')        
        for raw_entity in last_entities:
            # logger.debug(raw_entity)
            if raw_entity.get('entity','') == "word":
                word = raw_entity.get('value','')
        if len(word) > 0:
            slotsets.append(SlotSet('word',word))
            letters = []
            # say letters
            for letter in word:
                letters.append(letter.upper())
            message = word + " is spelled "+", ".join(letters)
            dispatcher.utter_message(text=message)
            # loop = asyncio.get_event_loop()
            
            await send_to_wikipedia(word,site)
            slotsets.append(FollowupAction('action_end'))  
        
        else:
            dispatcher.utter_message(text="I didn't hear the word you want to spell. Try again")
        
        
        return slotsets  
