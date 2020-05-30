"""
This class acts as glue and traffic controller between the various services

The following list shows incoming messages and consquent actions/outgoing messages.
////hotword/detected => dialog/end then wait dialog/ended then dialog/started,
microphone/start, asr/start
////dialog/continue => if text then tts/say then wait tts/finished then  microphone/start,
 asr/start    ELSE microphone/start, asr/start

////dialog/start => if text then dialog/started, asr/stop, nlu/parse ELSE  dialog/started,
 microphone/start, asr/start
////asr/text => asr/stop, hotword/stop, microphone/stop, nlu/parse
////nlu/intent => intent
////nlu/fail => dialog/end
////dialog/end => dialog/ended, microphone/start, hotword/start
////router/action => action
"""

import json
import time
import aiohttp
import asyncio
import async_timeout
import uuid
import logging
import motor
import motor.motor_asyncio
import sys 
import os
       
from MqttService import MqttService



class DataLoggerService(MqttService):
    """
    Logger Service Class
    """
    def __init__(
            self,
            config,
            loop
    ):
        super(
            DataLoggerService,
            self).__init__(config,loop)
        # self.log('dm init ')
        self.config = config
        self.subscribe_to = 'hermod/+/asr/text,hermod/+/nlu/intent,hermod/+/dialog/end,hermod/+/dialog/started' 
        self.dialogs = {}
        # self.nlu_log_path = config.get('services').get('DataLoggerService').get('capture_path')+'nlu/'
        # self.stories_log_path = config.get('services').get('DataLoggerService').get('capture_path')+'stories/'
 
    async def on_message(self, msg):
        # self.log("DLogger  message")
        # self.log(msg)
        topic = "{}".format(msg.topic)
        parts = topic.split("/")
        site = parts[1]
        payload_text = msg.payload
        payload = {}
        try:
            payload = json.loads(payload_text)
        except Exception as e:
            self.log(e)
            pass
        # self.log(payload)
        
        prep = 'hermod/' + site + '/'
        # if topic == prep + 'dialog/started':
            # if payload.get("id"):
                # self.dialogs[payload.get("id")] = {"id":payload.get("id"), "site":site}
        # el
        if topic == prep + 'asr/text':
            text = payload.get('text','')
            if payload.get("id") and text and len(text) > 0:
                self.log('LOGGER TEXT {}'.format(text))
                self.dialogs[payload.get("id")] = {"id":payload.get("id"), "site":site, "text":text}
                
        elif topic == prep + 'nlu/intent':
            self.log('LOGGER INTENT')
            # self.log(self.dialogs)
            if payload.get("id") in self.dialogs:
                intent = payload.get('intent',{}).get('name')
                entities = payload.get('entities',[])
                self.dialogs[payload.get("id")]["intent"] = intent
                self.dialogs[payload.get("id")]["entities"] = entities
                self.dialogs[payload.get("id")]["payload"] = payload
                self.dialogs[payload.get("id")]["site"] = site
                await self.write_nlu(payload.get("id"))
        # elif topic == prep + 'dialog/end':
            # text = payload.get('text','')
            # response = await self.request_get(self.rasa_server+"/conversations/"+site+"/tracker",{})
            # # self.log(response)
            # events = response.get('events',[])    
            # await self.write_stories(self.dialogs[payload.get("id")])
            
    
    
## DATABASE FUNCTIONS


    def mongo_connect(self):
        logger = logging.getLogger(__name__)
        logger.debug('MONGO CONNECT ')
        logger.debug(str(os.environ.get('MONGO_CONNECTION_STRING')))
        
        client = motor.motor_asyncio.AsyncIOMotorClient(os.environ.get('MONGO_CONNECTION_STRING'))

        db = client['hermod']
        collection = db['nlu_log']
        return collection

    async def save_nlu(self,uid,intent,example,site):
        self.log('SAVE NLU LOG')
        self.log([uid,intent,example])
        try:
            if uid and intent and example: 
                collection = self.mongo_connect() 
                # does intent and example already exist ?
                query = {'$and':[{'intent':intent},{'example':str(example).lower()}]}
                self.log(query)
                document = await collection.find_one(query)
                self.log(document)
                if document:
                    self.log('FOUND DOCUMENT MATCH')
                    # document['answer'] = answer
                    # site_parts = site.split('_')
                    # username = '_'.join(site_parts[:-1])
                    # document['user'] = username
                    # document['updated'] = time.time()
                    # result = await collection.replace_one({"_id":document.get('_id')},document)
                    # logger.debug(result)
                else:
                    self.log('not found so save')
                    site_parts = site.split('_')
                    username = '_'.join(site_parts[:-1])
                    document = {'dialog_id': uid,'intent':intent,'example':example,"user":username}
                    document['created'] = time.time()
                    result = await collection.insert_one(document)
                    self.log('result %s' % repr(result.inserted_id))
        except:
            self.log('SAVE NLU LOG ERR')
            e = sys.exc_info()
            self.log(e)


    # async def find_nlu(attribute,thing):
        # logger = logging.getLogger(__name__)
        # logger.debug('FIND FACT')
        # logger.debug([attribute,thing])
        # try:
            # logger.debug('FIND FACT conn')
            
            # collection = mongo_connect() 
            # logger.debug('FIND FACT CONNECTED')
            # query = {'$and':[{'attribute':attribute},{'thing':thing}]}
            # logger.debug(query)
            # document = await collection.find_one(query)
            # logger.debug(document)
            # if document:
                # return document.get('answer',None)
        # except:
            # logger.debug('FIND FACT ERR')
            # e = sys.exc_info()
            # logger.debug(e)
    
    async def write_nlu(self,uid):
        # self.log('LOGGER WRITE NLU '+self.nlu_log_path)
        if uid in self.dialogs:
            payload = self.dialogs.get(uid)
            self.log(payload)
            nlu_example=[]
            intent = payload.get('intent',False)
            site = payload.get('site','')
            self.log('intent '+intent)
            if intent:
                # nlu_example.append('## intent:'+intent)
                transcript = payload.get('text')
                entity_example = []
                entities = payload.get('entities',[])
                last_start = 0;
                for entity in entities:
                    # self.log(entity)
                    start = int(entity.get('start',0))
                    end = int(entity.get('end',0))
                    entity_name = entity.get('entity')
                    text = entity.get('text',entity.get('value',''))
                    # self.log(start)
                    # self.log(end)
                    # self.log(entity_name)
                    # self.log(text)
                    if (start  and end and entity_name and text):
                        # self.log('pre')
                        pre = transcript[last_start:start]
                        # self.log(pre)
                        entity_value = transcript[start:end]
                        # self.log('val')
                        # self.log(entity_value)
                        entity_example.append(pre)
                        entity_example.append('('+entity_value+')['+entity_name+']')
                        last_start = start + len(entity_value)
                entity_example.append(transcript[last_start:])
                # nlu_example.append(''.join(entity_example))
                self.log('NLU LOG FINAL')
                self.log('\n'.join(entity_example))
                # filename = intent+'_'+uid
                # # TODO asyncio file write
                # f = open(self.nlu_log_path+filename+'.md', "w")
                # f.write('\n'.join(nlu_example))
                # f.close()
                await self.save_nlu(uid,intent,''.join(entity_example),site)

                del self.dialogs[uid]
    
    # async def write_stories(self,dialog):
        # pass
        # # self.log('FINISH LOG')
        # # self.log(dialog)

    # async def request_get(self,url,json):
        # with async_timeout.timeout(10):
            # async with aiohttp.ClientSession() as session:
                # async with session.get(url,json = json, headers = {'content-type': 'application/json'}) as resp:
                    # # print(resp.status)
                    # return await resp.json()     


