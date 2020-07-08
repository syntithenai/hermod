"""
This class captures user conversations for use as training data to improve the model
Data is stored in mongo
Text and resulting NLU parse JSON are stored in the nlu_log collection
TODO: RASA Stories ...
"""

import json
import time
import asyncio

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
        self.config = config
        self.subscribe_to = 'hermod/+/asr/text,hermod/+/nlu/intent,hermod/+/dialog/end,hermod/+/dialog/started,hermod/+/rasa/story' 
        self.dialogs = {}
        self.last_text = {}
        
    async def on_message(self, msg):
        topic = "{}".format(msg.topic)
        parts = topic.split("/")
        site = parts[1]
        payload_text = msg.payload
        payload = {}
        try:
            payload = json.loads(payload_text)
        except Exception as e:
            pass
            # self.log(e)
        
        prep = 'hermod/' + site + '/'
        if topic == prep + 'asr/text':
            text = payload.get('text','')
            self.log('LOGGER TEXT {}'.format(text))
            if text and len(text) > 0:
                if payload.get("id",False):
                    # self.log('LOGGER TEXT {}'.format(text))
                    self.dialogs[payload.get("id")] = {"id":payload.get("id"), "site":site, "text":text}
                else:
                    self.last_text[site] = text
                    
        elif topic == prep + 'nlu/intent':
            self.log('LOGGER INTENT '+payload.get("id",'none'))
            self.log(payload)
            self.log(self.dialogs)
            if payload.get("id",False):
                if not payload.get("id") in self.dialogs:
                    self.dialogs[payload.get("id")] = {"text": self.last_text[site]}
            
                intent = payload.get('intent',{}).get('name')
                entities = payload.get('entities',[])
                self.dialogs[payload.get("id")]["intent"] = intent
                self.dialogs[payload.get("id")]["entities"] = entities
                self.dialogs[payload.get("id")]["payload"] = payload
                self.dialogs[payload.get("id")]["site"] = site
                if payload.get("text",False):
                    self.dialogs[payload.get("id")]["text"] = payload.get("text")
                await self.write_nlu(payload.get("id"))
    
        elif topic == prep + 'rasa/story':
            # self.log('RASA STORYT LOGGER')
            await self.write_stories(site,payload.get("id"),payload.get("story",""))
            
## DATABASE FUNCTIONS


    def mongo_connect(self,collection_name):
        client = motor.motor_asyncio.AsyncIOMotorClient(os.environ.get('MONGO_CONNECTION_STRING'))
        db = client['hermod']
        collection = db[collection_name]
        return collection

    async def save_nlu(self,uid,intent,example,site):
        try:
            if uid and intent and example: 
                collection = self.mongo_connect('nlu_log') 
                # does intent and example already exist ?
                query = {'$and':[{'intent':intent},{'example':str(example).lower()}]}
                document = await collection.find_one(query)
                if document:
                    pass
                else:
                    site_parts = site.split('_')
                    username = '_'.join(site_parts[:-1])
                    document = {'dialog_id': uid,'intent':intent,'example':example,"user":username}
                    document['created'] = time.time()
                    result = await collection.insert_one(document)
                    #self.log('result %s' % repr(result.inserted_id))
        except:
            self.log('SAVE NLU LOG ERR')
            e = sys.exc_info()
            self.log(e)

    
    async def write_nlu(self,uid):
        self.log(['DATA LOGGER WRITE NLU',uid,self.dialogs.get(uid)])
        if uid in self.dialogs:
            payload = self.dialogs.get(uid)
            nlu_example=[]
            intent = payload.get('intent',False)
            site = payload.get('site','')
            if intent:
                transcript = payload.get('text')
                entity_example = []
                entities = payload.get('entities',[])
                last_start = 0;
                for entity in entities:
                    start = int(entity.get('start',0))
                    end = int(entity.get('end',0))
                    entity_name = entity.get('entity')
                    text = entity.get('text',entity.get('value',''))
                    if (start  and end and entity_name and text):
                        pre = transcript[last_start:start]
                        entity_value = transcript[start:end]
                        entity_example.append(pre)
                        entity_example.append('('+entity_value+')['+entity_name+']')
                        last_start = start + len(entity_value)
                entity_example.append(transcript[last_start:])
                await self.save_nlu(uid,intent,''.join(entity_example),site)

                del self.dialogs[uid]

    async def write_stories(self,site,dialogId,data):
        # self.log(['WRITE STORIES',site,dialogId,data])
        try:
            if site and dialogId and data: 
                collection = self.mongo_connect('stories_log') 
                # does intent and example already exist ?
                query = {'$and':[{'site':site},{'dialog_id':dialogId}]}
                document = await collection.find_one(query)
                if document:
                    document['updated'] = time.time()
                    await collection.update_one({_id:document._id},{"$set":{'site':site,'dialog_id':dialogId,'data':data}}) 
                    # self.log("STORY UPDATE")
                else:
                    document = {'site':site,'dialog_id':dialogId,'data':data}
                    document['created'] = time.time()
                    result = await collection.insert_one(document)
                    # self.log("STORY INSERT")
                    #self.log('result %s' % repr(result.inserted_id))
        except:
            self.log('SAVE STORY LOG ERR')
            e = sys.exc_info()
            self.log(e)
        # if uid in self.dialogs:
            # payload = self.dialogs.get(uid)
            # nlu_example=[]
            # intent = payload.get('intent',False)
            # site = payload.get('site','')
            # if intent:
                # transcript = payload.get('text')
                # entity_example = []
                # entities = payload.get('entities',[])
                # last_start = 0;
                # for entity in entities:
                    # start = int(entity.get('start',0))
                    # end = int(entity.get('end',0))
                    # entity_name = entity.get('entity')
                    # text = entity.get('text',entity.get('value',''))
                    # if (start  and end and entity_name and text):
                        # pre = transcript[last_start:start]
                        # entity_value = transcript[start:end]
                        # entity_example.append(pre)
                        # entity_example.append('('+entity_value+')['+entity_name+']')
                        # last_start = start + len(entity_value)
                # entity_example.append(transcript[last_start:])
                # await self.save_nlu(uid,intent,''.join(entity_example),site)

                # del self.dialogs[uid]
    
    # async def write_stories(self,dialog):
        # pass
        # # self.log('FINISH LOG')
        # # self.log(dialog)

