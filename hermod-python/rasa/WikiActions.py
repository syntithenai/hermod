import asyncio
import inflect
import sys
import logging
import json
import os
import yaml
import time

from socket import error as socket_error        
from typing import Any, Text, Dict, List
#
import concurrent.futures
from rasa_sdk import Action, Tracker
from rasa_sdk.executor import CollectingDispatcher
from rasa_sdk.events import SlotSet, FollowupAction

import wikipediaapi
from mediawiki import MediaWiki
#from wikidata.client import WikiClient
import requests        
import wptools        
#import paho.mqtt.client as mqtt
import motor
import motor.motor_asyncio
from metaphone import doublemetaphone
import types
from asyncio_mqtt import Client
import Levenshtein as lev


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



CONFIG={
    'mqtt_hostname':os.environ.get('MQTT_HOSTNAME','localhost'),
    'mqtt_user':os.environ.get('MQTT_USER',''),
    'mqtt_password':os.environ.get('MQTT_PASSWORD',''),
    'mqtt_port':int(os.environ.get('MQTT_PORT','1883')) ,
}

async def publish(topic,payload): 
    async with AuthenticatedMqttClient(CONFIG.get('mqtt_hostname','localhost'),CONFIG.get('mqtt_port',1883),CONFIG.get('mqtt_user',''),CONFIG.get('mqtt_password','')) as client:
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




# def lookup_wiktionary(word):
    # logger = logging.getLogger(__name__)    
    # try:
        # wikipedia = MediaWiki()
        # wikipedia.set_api_url('https://en.wiktionary.org/w/api.php')
        # matches = {}
        # search_results = wikipedia.opensearch(word)
        # if len(search_results) > 0:
            # page_title = search_results[0][0]
            # page = wikipedia.page(page_title)
            # parts = page.content.split("\n")
            # i = 0
            # while i < len(parts):
                # definition = ""
                # part = parts[i].strip()
                
                # if part.startswith("=== Verb ===") or part.startswith("=== Noun ===") or part.startswith("=== Adjective ==="):
                    # #print(part)
                    # # try to skip the first two lines after the marker
                    # if (i + 1) < len(parts): 
                        # definition  = parts[i+1]
                    # if (i + 2) < len(parts) and len(parts[i+2].strip()) > 0: 
                        # definition  = parts[i+2]
                    # if (i + 3) < len(parts) and len(parts[i+3].strip()) > 0: 
                        # definition  = parts[i+3]
                
                
                # if part.startswith("=== Adjective ===") and not 'adjective' in matches:
                    # matches['adjective'] = definition
                # if part.startswith("=== Noun ===") and not 'noun' in matches:
                    # matches['noun'] = definition
                # if part.startswith("=== Verb ===") and not 'verb' in matches:
                    # matches['verb'] = definition
                    
                # i = i + 1
            # final = ""
            
            # # prefer verb, noun then adjective
            # if matches.get('adjective',False):
                # final = matches.get('adjective')
            # if matches.get('noun',False):
                # final = matches.get('noun')
            # if matches.get('verb',False):
                # final = matches.get('verb')
            # # strip leading bracket comment
            # if final[0] == '(':
                # close = final.index(")") + 1
                # final = final[close:]
            # matches['definition'] = final
        # return matches
    # except:
        # e = sys.exc_info()
        # logger.debug(e)


def lookup_wikipedia(word):
    logger = logging.getLogger(__name__)  
    try:
        wikipedia = MediaWiki()
        #wikipedia.set_api_url('https://en.wikpedia.org/w/api.php')
        final = {}
        search_results = wikipedia.opensearch(word,results=1)
        logger.debug('WIKI SEARCH RESTULS')
        logger.debug(search_results)
        if len(search_results) > 0:
            # logger.debug('WIKI SEARCH RESTULS2')
            page_title = search_results[0][0]
            page_link = search_results[0][2]
            link_parts = page_link.split("/")
            link_title = link_parts[-1]
            logger.debug('WIKI SEARCH RESTULS3'+link_title)
            # lookup summary/answer
            wiki_wiki = wikipediaapi.Wikipedia('en')
            page_py = wiki_wiki.page(link_title)
            if page_py and page_py.exists():
                logger.debug('WIKI PAGE SEARCH RESTULS')
                logger.debug(page_py)
                
                # fact fields
                final['thing'] = page_title
                final['answer'] = page_py.summary
                # plus
                final['url'] = page_py.canonicalurl
                
            # page = wikipedia.page(link_title)
            # logger.debug('WIKI SEARCH RESTULS single')
            # logger.debug(page_py)
        
            # parts = page.summary.split('. ')
            # summary = parts[0]
            #summary = page.summary
        logger.debug('WIKI PAGE SEARCH RESTULS FINAL')
        logger.debug(final)
        return final
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
            # SPECIAL HANDLING FOR SOME TYPES OF FACTS/FORMATS
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


def mongo_connect(collection):
    # logger = logging.getLogger(__name__)
    # logger.debug('MONGO CONNECT ')
    # logger.debug(str(os.environ.get('MONGO_CONNECTION_STRING')))
    
    client = motor.motor_asyncio.AsyncIOMotorClient(os.environ.get('MONGO_CONNECTION_STRING'))

    db = client['hermod']
    collection = db[collection]
    return collection
    
# def mongo_connect_words():
    # # logger = logging.getLogger(__name__)
    # # logger.debug('MONGO CONNECT ')
    # # logger.debug(str(os.environ.get('MONGO_CONNECTION_STRING')))
    
    # client = motor.motor_asyncio.AsyncIOMotorClient(os.environ.get('MONGO_CONNECTION_STRING'))

    # db = client['hermod']
    # collection = db['wordset_dictionary']
    # return collection

async def save_fact(attribute,thing,answer,site,thing_type):
    logger = logging.getLogger(__name__)
    logger.debug('SAVE FACT')
    logger.debug([attribute,thing,answer])
    try:
        if attribute and thing and answer: 
            collection = mongo_connect('wikifacts') 
            # does fact already exist and need update ?
            query = {'$and':[{'attribute':attribute},{'thing':thing}]}
            # logger.debug(query)
            document = await collection.find_one(query)
            # logger.debug(document)
            if document:
                # logger.debug('FOUND DOCUMENT MATCH')
                document['answer'] = answer
                site_parts = site.split('_')
                username = '_'.join(site_parts[:-1])
                document['user'] = username
                document['updated'] = time.time()
                result = await collection.replace_one({"_id":document.get('_id')},document)
                #logger.debug(result)
            else:
                # logger.debug('SAVE FACT not found')
                site_parts = site.split('_')
                username = '_'.join(site_parts[:-1])
                document = {'attribute': attribute.lower(),'thing':thing.lower(),'answer':answer,"user":username,"thing_type":thing_type}
                document['created'] = time.time()
                document['updated'] = time.time()
                result = await collection.insert_one(document)
                # logger.debug('result %s' % repr(result.inserted_id))
    except:
        logger.debug('SAVE FACT ERR')
        e = sys.exc_info()
        logger.debug(e)


async def find_fact(attribute,thing):
    logger = logging.getLogger(__name__)
    # logger.debug('FIND FACT')
    # logger.debug([attribute,thing])
    try:
        # logger.debug('FIND FACT conn')
        
        collection = mongo_connect('wikifacts') 
        # logger.debug('FIND FACT CONNECTED')
        query = {'$and':[{'attribute':attribute},{'thing':thing}]}
        # logger.debug(query)
        document = await collection.find_one(query)
        # logger.debug(document)
        if document:
            return document
        else:
            return None
    except:
        logger.debug('FIND FACT ERR')
        e = sys.exc_info()
        logger.debug(e)


async def find_word(word):
    logger = logging.getLogger(__name__)
    # logger.debug('FIND WORD')
    # logger.debug([word])
    try:
        collection = mongo_connect('wordset_dictionary') 
        # logger.debug('FIND WORD CONNECTED')
        query = {'word':word}
        # logger.debug(query)
        document = await collection.find_one(query)
        # logger.debug('FIND WORD found')
        # logger.debug(document)
        if document:
            return document
        else:
            return None
    except:
        logger.debug('FIND WORD ERR')
        e = sys.exc_info()
        logger.debug(e)

async def search_word(word):
    logger = logging.getLogger(__name__)
    metaname = doublemetaphone(word)
    queryname = metaname[0]+metaname[1]
    # logger.debug('SEARCH WORD')
    # logger.debug([word,queryname])
    try:
        collection = mongo_connect('wordset_dictionary') 
        #query = {'_s_word':queryname}
        query={"_s_word":{"$eq":queryname}}
        # logger.debug(query)
        distances=[]
        # logger.debug('SEARCH WORD A')
        # logger.debug(collection)
        async for document in collection.find(query): #:
            # logger.debug('SEARCH WORD FOUND')
            # logger.debug(document)
            distance = lev.jaro_winkler(word,document.get('word'))
            distances.append({"word":document.get('word'),"distance":distance,"data":document})
        if len(distances) > 0:
            distances.sort(key=lambda x: x.get('distance'), reverse=True)
            # logger.debug('SEARCH DIST LIST')
            # logger.debug(distances)
            return distances[0].get('data')
        else:
            return None

    except:
        logger.debug('SEARCH WORD ERR')
        e = sys.exc_info()
        logger.debug(e)

def remove_text_inside_brackets(text, brackets="()[]"):
    count = [0] * (len(brackets) // 2) # count open/close brackets
    saved_chars = []
    for character in text:
        for i, b in enumerate(brackets):
            if character == b: # found bracket
                kind, is_close = divmod(i, 2)
                count[kind] += (-1)**is_close # `+1`: open, `-1`: close
                if count[kind] < 0: # unbalanced bracket
                    count[kind] = 0  # keep it
                else:  # found bracket to remove
                    break
        else: # character is not a [balanced] bracket
            if not any(count): # outside brackets
                saved_chars.append(character)
    return ''.join(saved_chars)                



# find first slot with name in the array match_slots
def extract_slots(tracker,match_slots):
    slots = tracker.current_state().get('slots')
    for slot in slots:
        if slot in match_slots :
            return slots[slot]

# find first matching entity    
def extract_entities(tracker,match_entities):
    last_entities = tracker.current_state()['latest_message']['entities']
    for raw_entity in last_entities:
        if raw_entity.get('entity','') in match_entities:
            return raw_entity.get('value','')
    
def summary_from_answer(answer,paginate = 0, sections = 1):
    logger = logging.getLogger(__name__)
    logger.debug(['SMA',answer,paginate,sections])
    # clear bracketed information for speech
    parts = remove_text_inside_brackets(answer).split('. ')
    summary = ''
    # up to four sections. Max 300 letters per sentence.
    if len(parts) > paginate:
        summary = parts[paginate].ljust(300)[:300].strip()
    if sections > 1 and len(parts) > paginate + 1:
        summary = summary + ". " + parts[paginate + 1].ljust(300)[:300].strip()
    if sections > 2 and len(parts) > paginate + 2:
        summary = summary + ". " + parts[paginate + 2].ljust(300)[:300].strip()
    if sections > 3 and len(parts) > paginate + 3:
        summary = summary + ". " + parts[paginate + 3].ljust(300)[:300].strip()
    return summary

async def do_wikipedia_search(word,slotsets,site,dispatcher,paginate=0,sections=1):
    logger = logging.getLogger(__name__)
    cached_fact = await find_fact('summary',word.lower())
    if cached_fact:
        await publish('hermod/'+site+'/display/show',{'frame':'https://en.wikipedia.org/wiki/'+word})
        summary = summary_from_answer(cached_fact.get('answer'),paginate,sections)
        if len(summary) > 0:
            slotsets.append(SlotSet('thing',word))
            slotsets.append(SlotSet('last_wikipedia_search',int(paginate) + int(sections)))        
            dispatcher.utter_message(text=summary)
        else:
            slotsets.append(SlotSet('thing',word))
            slotsets.append(SlotSet('last_wikipedia_search',0))        
            dispatcher.utter_message(text='No more to read. All done.')
            #slotsets.append(FollowupAction('action_end'))  

    else:   
        await publish('hermod/'+site+'/tts/say',{"text":"Looking now"})
        await publish('hermod/'+site+'/display/startwaiting',{})
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(None,lookup_wikipedia,word)
        logger.debug('WIKI  call done')
        if result:
            # slotsets.append(SlotSet('thing',word))
            # logger.debug(result)
            #parts = remove_text_inside_brackets(result.get('answer')).split('. ')
            summary = summary_from_answer(result.get('answer'),paginate,sections)
            await save_fact('summary',result.get('thing'),result.get('answer'),site,'')
            await publish('hermod/'+site+'/display/show',{'frame':result.get('url')})
            await publish('hermod/'+site+'/display/show',{'buttons':[{"label":'Tell me more',"text":'tell me more'}]})
            slotsets.append(SlotSet('thing',result.get('thing')))
            slotsets.append(SlotSet('last_wikipedia_search',int(paginate) + 1))        
            dispatcher.utter_message(text= summary)
            #slotsets.append(FollowupAction('action_end'))  
        else:
            await publish('hermod/'+site+'/display/show',{'frame':'https://en.wikipedia.org/wiki/'+word})
            slotsets.append(SlotSet('thing',None))
            slotsets.append(SlotSet('last_wikipedia_search',0)   )     
            dispatcher.utter_message(text="I can't find the topic "+word)
            
            #slotsets.append(FollowupAction('action_end'))  


class ActionSearchWiktionary(Action):

    def name(self) -> Text:
        return "action_search_wiktionary"

    async def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        logger = logging.getLogger(__name__)    
        site = tracker.current_state().get('sender_id')
        word = extract_entities(tracker,'word')
        slotsets = []
        if word and len(word) > 0:
            word_record = await find_word(word)
        
            if not word_record:
                # try fuzzy match
                word_record = await search_word(word)
            
            if word_record:
                # assign corrected word to slot
                slotsets.append(SlotSet('word',word_record.get('word')))
                # clear slots for wiki
                # slotsets.append(SlotSet('thing',None))
                # slotsets.append(SlotSet('attribute',None))
                # slotsets.append(SlotSet('last_wikipedia_search',1))
                
                meanings = word_record.get('meanings')
                if len(meanings) > 0:
                    meaning = meanings[0]    
                    if meaning.get('def',False):
                        meaning_parts=[]
                        if meaning.get('speech_part',False):
                            meaning_parts.append(' the {} '.format(meaning.get('speech_part')))
                        meaning_parts.append(word_record.get('word'))
                        meaning_parts.append(' means {}.'.format(meaning.get('def')))
                        if meaning.get('synonyms',False) and len(meaning.get('synonyms')) > 0:
                            if len(meaning.get('synonyms')) > 1:
                                meaning_parts.append(' It has synonyms {}.'.format(", ".join(meaning.get('synonyms'))))
                            else:
                                meaning_parts.append(' It has a synonym {}. '.format(meaning.get('synonyms')[0]))
                        await publish('hermod/'+site+'/display/show',{'frame':'https://en.wiktionary.org/wiki/'+word_record.get('word')})
                        #slotsets.append(SlotSet('last_wiktionary_search',0))
                        if len(meanings) > 1:
                            meaning2 = meanings[1] 
                            meaning_parts.append(' It can also be ')
                            if meaning2.get('speech_part',False):
                                meaning_parts.append(' an {} '.format(meaning2.get('speech_part')))
                            meaning_parts.append(' {}.'.format(meaning2.get('def')))
                            if meaning2.get('synonyms',False) and len(meaning2.get('synonyms')) > 0:
                                if len(meaning2.get('synonyms')) > 1:
                                    meaning_parts.append(' with synonyms {}'.format(", ".join(meaning2.get('synonyms'))))
                                else:
                                    meaning_parts.append(' with a synonym {}'.format(meaning2.get('synonyms')[0]))
                        dispatcher.utter_message(text="".join(meaning_parts))
                        slotsets.append(SlotSet("hermod_force_continue", None))
                        slotsets.append(SlotSet("hermod_force_end", "true"))      
            else:
                dispatcher.utter_message(text="I couldn't find the meaning of "+word)   
            await publish('hermod/'+site+'/display/show',{'question':'Define the word '+word})
            slotsets.append(SlotSet("hermod_force_continue", "true"))  
             
        else:
            dispatcher.utter_message(text="I didn't hear the word you want defined. Try again")
            slotsets.append(SlotSet("hermod_force_continue", "true"))  
        
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
        #last_entities = tracker.current_state()['latest_message']['entities']
        #word = ''
        thing_type=''
        slotsets = []
        #thing_type='thing'
        word = extract_entities(tracker,['thing','place','person','word'])
        site = tracker.current_state().get('sender_id')        
        
        # slotsets.append(SlotSet('last_wikipedia_search',0))
        # slotsets.append(SlotSet('word',None))
        # slotsets.append(SlotSet('attribute',None))
        if word and len(word) > 0:
            # fill text search box
            await publish('hermod/'+site+'/display/show',{'question':'Tell me about '+word})
                    
            await do_wikipedia_search(word,slotsets,site,dispatcher)
                
        else:
            dispatcher.utter_message(text="I didn't hear your question. Try again")
            slotsets.append(SlotSet("hermod_force_continue", "true"))
        #await publish('hermod/'+site+'/display/stopwaiting',{})
        
        return slotsets
        

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
        thing_type = ''
        last_wikipedia_search = 1
        slotsets = []
        # word = extract_slots(tracker,['thing','place','person','word'])
        # last_wikipedia_search = extract_slots(tracker,['last_wikipedia_search'])
        slots = tracker.current_state().get('slots')
        for slot in slots:
            if slot == "thing" or  slot == "person" or  slot == "place":
                if not word or len(word) <= 0:
                    logger.debug('SET FROM SLOT '+str(slot)+' ' +str(slots[slot]))
                    word = slots[slot]
                    thing_type=slot
            if slot == "last_wikipedia_search" and slots[slot] and slots[slot] > 0:
                last_wikipedia_search = slots[slot] 
        
        
        site = tracker.current_state().get('sender_id')     
        
        if word and len(word) > 0:
            # fill text search box
            await publish('hermod/'+site+'/display/show',{'question':'Tell me about '+word})
            await do_wikipedia_search(word,slotsets,site,dispatcher,last_wikipedia_search,2)
                
        else:
            dispatcher.utter_message(text="I didn't hear your question. Try again")
            slotsets.append(SlotSet("hermod_force_continue", "true"))
        #await publish('hermod/'+site+'/display/stopwaiting',{})
        
        return slotsets   
        # if word and len(word) > 0:
            # cached_fact = await find_fact('summary',word.lower())
            # if cached_fact:
                # #await publish('hermod/'+site+'/display/show',{'frame':'https://en.wikipedia.org/wiki/'+word})
                # parts = remove_text_inside_brackets(cached_fact.get('answer')).split('. ')
                # summary = parts[last_wikipedia_search]).strip()
                # #parts = summary.split('. ')
                # # TODO .....
                # # two sentences per request for more
                # if len(parts) > (last_wikipedia_search + 1):
                    # summary2 = parts[last_wikipedia_search]).ljust(200)[:200].strip()
                    # summary = ". ".join([summary,summary2])
                    # last_wikipedia_search = last_wikipedia_search + 1
                    
                # if summary and len(summary) > 0:
                    # dispatcher.utter_message(text=summary)
                # else:
                    # dispatcher.utter_message(text="I don't know any more information about "+word)
                    # slotsets.append(FollowupAction('action_end'))  
                
                # #slotsets.append(FollowupAction('action_end'))  
        
            # else:   
                # await publish('hermod/'+site+'/tts/say',{"text":"Looking now"})
                # await publish('hermod/'+site+'/display/startwaiting',{})
                # loop = asyncio.get_event_loop()
                # result = await loop.run_in_executor(None,lookup_wikipedia,word)
                # #result = lookup_wikipedia(word)
                # if result:
                    # parts = remove_text_inside_brackets(result.get('answer')).split('. ')
                    # #summary = parts[last_wikipedia_search].ljust(200)[:200].strip()
                    # summary = remove_text_inside_brackets(parts[last_wikipedia_search]).ljust(200)[:200].strip()
                    # await save_fact('summary',result.get('thing'),result.get('answer'),site,'')
                    # await publish('hermod/'+site+'/display/show',{'frame':'https://en.wikipedia.org/wiki/'+result.get('thing')})
                    # dispatcher.utter_message(text=summary)
                    # #slotsets.append(FollowupAction('action_end'))  
                # else:
                    # await publish('hermod/'+site+'/display/show',{'frame':'https://en.wikipedia.org/wiki/'+word})
                    # dispatcher.utter_message(text="I can't find the topic "+word)
                    # slotsets.append(SlotSet("hermod_force_continue", "true"))
            # await publish('hermod/'+site+'/display/show',{'question':'Tell me about '+word})
                    
            # slotsets.append(SlotSet('last_wikipedia_search',int(last_wikipedia_search)))
        
                
        # else:
            # dispatcher.utter_message(text="I didn't hear your question. Try again")
            # slotsets.append(SlotSet("hermod_force_continue", "true"))
        # await publish('hermod/'+site+'/display/stopwaiting',{})
        
        return slotsets

class ActionSpeakMnemonic(Action):

    def name(self) -> Text:
        return "action_speak_mnemonic"

    async def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        logger = logging.getLogger(__name__)    
        last_entities = tracker.current_state()['latest_message']['entities']
        attribute = ''
        thing = ''
        thing_type=''
        slotsets = []
        # pull thing parameters from saved slots ?
        slots = tracker.current_state().get('slots')
        for slot in slots:
            if slot == "thing" or  slot == "person" or  slot == "place" and slot in slots and slots[slot] and len(slots[slot]) > 0:
                if not thing or len(thing) <= 0:
                    logger.debug('SET FROM SLOT '+str(slot)+' ' +str(slots[slot]))
                    thing = slots[slot]
                    thing_type=slot
            if slot == "attribute" :
                if not attribute or len(attribute) <= 0:
                    logger.debug('SET FROM SLOT '+str(slot)+' ' +str(slots[slot]))
                    attribute = slots[slot]
                    
        for raw_entity in last_entities:
            # logger.debug(raw_entity)
            if raw_entity.get('entity','') == "attribute":
                if not len(attribute) > 0:
                    attribute = raw_entity.get('value','')
                    slotsets.append(SlotSet('attribute',attribute))
            # thing = extract_entities(tracker,['thing','place','person','word'])
            # if thing:
                # slotsets.append(SlotSet('thing',thing))
            
            if raw_entity.get('entity','') == "thing":
                if not len(thing) > 0:
                    thing = raw_entity.get('value','')
                    thing_type='thing'
                    slotsets.append(SlotSet('thing',thing))
            if raw_entity.get('entity','') == "place":
                if not len(thing) > 0:
                    thing = raw_entity.get('value','')
                    thing_type='place'
                    slotsets.append(SlotSet('place',thing))
            if raw_entity.get('entity','') == "person":
                if not len(thing) > 0:
                    thing = raw_entity.get('value','')
                    thing_type='person'
                    slotsets.append(SlotSet('person',thing))
            if raw_entity.get('entity','') == "word":
                if not len(thing) > 0:
                    thing = raw_entity.get('value','')
                    thing_type='word'
                    slotsets.append(SlotSet('thing',thing))
        
        # logger.debug(last_entities)
        # logger.debug('THING FROM ENTITIES'+thing)
        # logger.debug('ATTRIBUTE FROM ENTITIES'+attribute)
        # logger.debug('SLOTS')
        # logger.debug(slots)        
        

        # logger.debug('THING FROM SLOTS'+thing)
        # logger.debug('ATTRIBUTE FROM SLOTS'+attribute)
              
        site = tracker.current_state().get('sender_id')  
        
        if attribute and thing and len(attribute) > 0 and len(thing) > 0:
            result = await find_fact(attribute.lower(),thing.lower())
            # logger.debug('MNEMON LOOKUP FACT')
            # logger.debug(result)
            # logger.debug([attribute,thing])
            await publish('hermod/'+site+'/display/show',{'question':'What is the memory aid for the '+attribute+' of '+thing})
            if result and result.get('mnemonic',False):
                dispatcher.utter_message(text="The memory aid for the "+attribute+" of "+thing+" is, "+result.get('mnemonic'))
            else:
                dispatcher.utter_message(text="I don't know a memory aid for the "+attribute+" of "+thing)
        else:
            dispatcher.utter_message(text="I don't know which memory aid you want")
        #slotsets.append(FollowupAction('action_end'))      
        
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
        site = tracker.current_state().get('sender_id')  
        last_entities = tracker.current_state()['latest_message']['entities']
        attribute = ''
        thing = ''
        thing_type=''
        slotsets = []
        # pull thing parameters from saved slots ?
        slots = tracker.current_state().get('slots')
        for slot in slots:
            if slot == "thing" or  slot == "person" or  slot == "place" and slot in slots and slots[slot] and len(slots[slot]) > 0:
                if not thing or len(thing) <= 0:
                    # logger.debug('SET FROM SLOT '+str(slot)+' ' +str(slots[slot]))
                    thing = slots[slot]
                    thing_type=slot
            # if slot == "attribute" :
                # logger.debug('SET FROM SLOT '+str(slot)+' ' +str(slots[slot]))
                # attribute = slots[slot]
        # entities override slots
        for raw_entity in last_entities:
            # logger.debug(raw_entity)
            if raw_entity.get('entity','') == "attribute":
                # if not len(attribute) > 0:
                    attribute = raw_entity.get('value','')
                    slotsets.append(SlotSet('attribute',attribute))
            if raw_entity.get('entity','') == "thing":
                # if not len(thing) > 0:
                    thing = raw_entity.get('value','')
                    thing_type='thing'
                    slotsets.append(SlotSet('thing',thing))
                    break
            if raw_entity.get('entity','') == "place":
                # if not len(thing) > 0:
                    thing = raw_entity.get('value','')
                    thing_type='place'
                    slotsets.append(SlotSet('place',thing))
                    break
            if raw_entity.get('entity','') == "person":
                # if not len(thing) > 0:
                    thing = raw_entity.get('value','')
                    thing_type='person'
                    slotsets.append(SlotSet('person',thing))
                    break
            if raw_entity.get('entity','') == "word":
                # if not len(thing) > 0:
                    thing = raw_entity.get('value','')
                    thing_type='word'
                    slotsets.append(SlotSet('thing',thing))
                    break
        
        # logger.debug(last_entities)
        # logger.debug('THING FROM ENTITIES'+thing)
        # logger.debug('ATTRIBUTE FROM ENTITIES'+attribute)
        # logger.debug('SLOTS')
        # logger.debug(slots)        
        
        
                
        site = tracker.current_state().get('sender_id')        
        if attribute and thing and len(attribute) > 0 and len(thing) > 0:
            cached_fact = await find_fact(attribute.lower(),thing.lower())
            if cached_fact:
                await publish('hermod/'+site+'/display/show',{'frame':'https://en.wikipedia.org/wiki/'+thing})
                if cached_fact.get('mnemonic',False) and len(cached_fact.get('mnemonic')) > 0:
                    await publish('hermod/'+site+'/display/show',{'buttons':[{"label":'Tell me the memory aid',"text":'Tell me the memory aid'}]})
                dispatcher.utter_message(text="The "+attribute+" of "+thing+" is "+ cached_fact.get('answer'))
            else:   
                slotsets.append(SlotSet('mnemonic',None))  
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
                    await save_fact(attribute.lower(),thing.lower(),result,site,thing_type)
                    await publish('hermod/'+site+'/display/show',{'frame':'https://en.wikipedia.org/wiki/'+thing})
                    dispatcher.utter_message(text="The "+attribute+" of "+thing+" is "+ result)
                    # TODO send hermod/XX/display/url  {'url':'https://en.wiktionary.org/wiki/'+word} 
                    
                else:
                    await publish('hermod/'+site+'/display/show',{'frame':'https://en.wikipedia.org/wiki/'+thing})
                    dispatcher.utter_message(text="I don't know the "+attribute+" of "+thing)
                #slotsets.append(FollowupAction('action_end'))  
            await publish('hermod/'+site+'/display/show',{'question':'What is the '+attribute+' of '+thing})
                
        # no thing :(
        elif attribute  and len(attribute) > 0:
            dispatcher.utter_message(text="I didn't hear your question. Try again")
            slotsets.append(SlotSet("hermod_force_continue", "true"))
        
        # fallback to wikipedia search if attribute isn't specified
        elif  thing and len(thing) > 0:
            await publish('hermod/'+site+'/display/show',{'question':'What is the '+attribute+' of '+thing})
            await  do_wikipedia_search(thing,slotsets,site,dispatcher)
            # cached_fact = await find_fact('summary',thing.lower())
            # if cached_fact:
                # word = cached_fact.get('thing')
                # await publish('hermod/'+site+'/display/show',{'frame':'https://en.wikipedia.org/wiki/'+word})
                # parts = cached_fact.get('answer').split('. ')
                # #summary = parts[0].ljust(200)[:200].strip()
                # summary = remove_text_inside_brackets(parts[0]).ljust(200)[:200].strip()
                    
                # dispatcher.utter_message(summary)
                # #slotsets.append(FollowupAction('action_end'))  
        
            # else:   
                # await publish('hermod/'+site+'/tts/say',{"text":"Looking now"})
                # await publish('hermod/'+site+'/display/startwaiting',{})
                # loop = asyncio.get_event_loop()
                # result = await loop.run_in_executor(None,lookup_wikipedia,thing)
                # if result:
                    # parts = result.get('answer').split('. ')
                    # #summary = parts[0].ljust(200)[:200].strip();
                    # summary = remove_text_inside_brackets(parts[last_wikipedia_search]).ljust(200)[:200].strip()
                    
                    # await save_fact('summary',result.get('thing'),result.get('answer'),site,'')
                    # await publish('hermod/'+site+'/display/show',{'frame':result.get('url')})
                    # await publish('hermod/'+site+'/display/show',{'buttons':[{"label":'Tell me more',"text":'tell me more'}]})
                    
                    # dispatcher.utter_message(text=result.get('thing') + ". " + summary)
                    # #slotsets.append(FollowupAction('action_end'))  
                # else:
                    # await publish('hermod/'+site+'/display/show',{'frame':'https://en.wikipedia.org/wiki/'+thing})
                    # dispatcher.utter_message(text="I can't find the topic "+thing)
                    # slotsets.append(FollowupAction('action_end'))  
            
            
            # await publish('hermod/'+site+'/display/show',{'frame':'https://en.wikipedia.org/wiki/'+thing})
            # result = await lookup_wikipedia(thing)
            # if result and len(result) > 0:
                # dispatcher.utter_message(text=thing + ". " + result)
            # else:
                # dispatcher.utter_message(text="I can't find the topic "+thing)
            # slotsets.append(FollowupAction('action_end'))  
        
        else:
            dispatcher.utter_message(text="I didn't hear your question. Try again")
            slotsets.append(SlotSet("hermod_force_continue", "true"))
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
        site = tracker.current_state().get('sender_id')  
        # only interested in entities from the last utterance        
        for raw_entity in last_entities:
            logger.debug(raw_entity)
            if raw_entity.get('entity','') == "attribute":
                attribute = raw_entity.get('value','')
                slotsets.append(SlotSet('attribute',attribute))
            
            # also process number entities (from duckling) as the answer
            if raw_entity.get('entity','') == "number" and len(answer) <= 0:
                answer = raw_entity.get('value','')
                slotsets.append(SlotSet('answer',answer))
            if raw_entity.get('entity','') == "thing":
                if raw_entity.get('value',False):
                    thing = raw_entity.get('value','')
                    slotsets.append(SlotSet('thing',thing))
            if raw_entity.get('entity','') == "place":
                if raw_entity.get('value',False):
                    thing = raw_entity.get('value','')
                    slotsets.append(SlotSet('place',thing))
            if raw_entity.get('entity','') == "person":
                if raw_entity.get('value',False):
                    thing = raw_entity.get('value','')
                    slotsets.append(SlotSet('person',thing))
            if raw_entity.get('entity','') == "answer":
                # hack for NLU fail find duplicate answers
                # treat first answer as thing
                if len(answer) > 0:
                    # only if thing not already found
                    if not len(thing) > 0:
                        thing = answer;
                        answer = raw_entity.get('value','')
                        slotsets.append(SlotSet('answer',answer))
                        slotsets.append(SlotSet('thing',thing))                    
                    # override the answer
                    else:
                        answer = raw_entity.get('value','')
                        slotsets.append(SlotSet('answer',answer))
                else:
                    answer = raw_entity.get('value','')
                    slotsets.append(SlotSet('answer',answer))
                    
        logger.debug('CONFIRM SAVE FACT')
        logger.debug([attribute,thing,answer])
        await publish('hermod/'+site+'/display/show',{'question':'Remember that the '+attribute+' of '+thing+' is '+answer})
        await publish('hermod/'+site+'/display/show',{'buttons':[{"label":'Yes please',"text":'yes please'},{"label":'No thanks',"text":'No thanks'}]})                
        if attribute and thing and len(attribute) > 0 and len(thing) > 0 and answer and len(answer) > 0:
            dispatcher.utter_message(text="Do you want me to remember that the "+attribute+" of "+thing+" is "+answer)
            slotsets.append(SlotSet("hermod_force_continue", "true"))  
        else:
            dispatcher.utter_message(text="I can't save because I'm missing information")
            
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
        logger.debug('ACTION SAVE FACT')
        logger.debug(slots)
        slotsets = []
        thing=''
        answer=''
        attribute=''
        thing_type=''
        
        site = tracker.current_state().get('sender_id')        
        for slot in slots:
            if slot == "thing" or  slot == "person" or  slot == "place":
                if not slots[slot] == None:
                    logger.debug('SET FROM SLOT '+str(slot)+' ' +str(slots[slot]))
                    thing = slots[slot]
                    thing_type=slot
            if slot == "attribute" :
                if not slots[slot] == None:
                    logger.debug('SET FROM SLOT '+str(slot)+' ' +str(slots[slot]))
                    attribute = slots[slot]
            if slot == "answer" :
                if not slots[slot] == None:
                    logger.debug('SET FROM SLOT '+str(slot)+' ' +str(slots[slot]))
                    answer = slots[slot]
        logger.debug([attribute,thing,answer])        
        if attribute and thing and len(attribute) > 0 and len(thing) > 0 and answer and len(answer) > 0:
            await save_fact(attribute.lower(),thing.lower(),answer,site,thing_type)
            dispatcher.utter_message(text="Saved")
            slotsets.append(SlotSet("hermod_force_end", "true"))
        else:
            dispatcher.utter_message(text="Can't save because I'm missing information")
            slotsets.append(SlotSet("hermod_force_end", "true"))


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
        
        slots = tracker.current_state().get('slots')
        
        for slot in slots:
            if slot == "word" :
                if not word or len(word) <= 0:
                    word = slots[slot]

        for raw_entity in last_entities:
            # logger.debug(raw_entity)
            if raw_entity.get('entity','') == "word":
                word = raw_entity.get('value','')
        
        slotsets = []
        if word and len(word) > 0:
            await publish('hermod/'+site+'/tts/say',{"text":"Looking now"})
            word_record = await find_word(word)
            
            if not word_record:
                # try fuzzy match
                word_record = await search_word(word)
            
            if word_record:
                word = word_record.get('word')
                slotsets.append(SlotSet('word',word))
                letters = []
                # say letters
                for letter in word:
                    letters.append(letter.upper())
                message = word + " is spelled "+", ".join(letters)
                dispatcher.utter_message(text=message)
                # loop = asyncio.get_event_loop()
            
                await send_to_wikipedia(word,site)
                # slotsets.append(FollowupAction('action_end'))  
                slotsets.append(SlotSet("hermod_force_continue", None))
                slotsets.append(SlotSet("hermod_force_end", "true"))      
            else:
                dispatcher.utter_message(text="I don't know the word "+word+". Try again")
                slotsets.append(SlotSet("hermod_force_continue", "true"))
            await publish('hermod/'+site+'/display/show',{'question':'Spell the word '+word})
        else:
            dispatcher.utter_message(text="I didn't hear the word you want to spell. Try again")
            slotsets.append(SlotSet("hermod_force_continue", "true"))
        
        
        return slotsets  


class ActionSynonymsWord(Action):
#
    def name(self) -> Text:
        return "action_synonyms_word"
#
    async def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        logger = logging.getLogger(__name__)    
        site = tracker.current_state().get('sender_id')
        word = extract_entities(tracker,'word')
        slotsets = []
        if word and len(word) > 0:
            word_record = await find_word(word)
        
            if not word_record:
                # try fuzzy match
                word_record = await search_word(word)
            
            if word_record:
                # assign corrected word to slot
                slotsets.append(SlotSet('word',word_record.get('word')))
                # clear slots for wiki
                # slotsets.append(SlotSet('thing',None))
                # slotsets.append(SlotSet('attribute',None))
                # slotsets.append(SlotSet('last_wikipedia_search',1))
                
                meanings = word_record.get('meanings')
                if len(meanings) > 0:
                    collatedSynonyms=[]
                    for meaning in meanings:
                        if meaning.get('synonyms',False) and len(meaning.get('synonyms')) > 0:
                            for synonym in meaning.get('synonyms',[]):
                                collatedSynonyms.append(synonym)
                    if len(collatedSynonyms) > 0:
                         dispatcher.utter_message(text='The word '+word_record.get('word')+' has synonyms {}.'.format(", ".join(collatedSynonyms))  )
                         await publish('hermod/'+site+'/display/show',{'frame':'https://en.wiktionary.org/wiki/'+word_record.get('word')})
                         slotsets.append(SlotSet("hermod_force_continue", None))
                         slotsets.append(SlotSet("hermod_force_end", "true"))      
                    else :
                        dispatcher.utter_message(text="I don't know any synonyms for the word "+word_record.get('word') )
                        await publish('hermod/'+site+'/display/show',{'frame':'https://en.wiktionary.org/wiki/'+word_record.get('word')})
                    await publish('hermod/'+site+'/display/show',{'question':'what are synonyms of '+word_record.get('word')})
                else:
                    dispatcher.utter_message(text="I couldn't find any synonyms for the word "+word_record.get('word'))   
                    await publish('hermod/'+site+'/display/show',{'question':'what are synonyms of '+word_record.get('word')})
                    slotsets.append(SlotSet("hermod_force_continue", "true"))      
 
            else:
                dispatcher.utter_message(text="I couldn't find the word "+word)   
                await publish('hermod/'+site+'/display/show',{'question':'what are synonyms of '+word})
                slotsets.append(SlotSet("hermod_force_continue", "true"))  
             
        else:
            dispatcher.utter_message(text="I didn't hear the word you want defined. Try again")
            slotsets.append(SlotSet("hermod_force_continue", "true"))  
        
        return slotsets
        
        
