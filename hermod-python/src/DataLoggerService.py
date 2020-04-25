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
        self.nlu_log_file = config.get('services').get('DataLoggerService').get('capture_path')+'nlu'
        self.stories_log_file = config.get('services').get('DataLoggerService').get('capture_path')+'stories'

    async def callback_hotword_dialog_ended(self, prep, topic, message):
        uid = uuid.uuid4().hex
        await self.client.publish(prep + 'dialog/started', json.dumps({"id":uid}))
        await self.client.publish(prep + 'asr/start', json.dumps({"id":uid}))
        await self.client.publish(prep + 'microphone/start', json.dumps({}))
        
   
    async def on_message(self, msg):
        # self.log("DM start message")
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
        if topic == prep + 'dialog/started':
            if payload.get("id"):
                self.dialogs[payload.get("id")] = {"id":payload.get("id"), "site":site}
        elif topic == prep + 'asr/text':
            text = payload.get('text','')
            if payload.get("id") in self.dialogs:
                self.dialogs[payload.get("id")]["text"] = text
        elif topic == prep + 'nlu/intent':
            if payload.get("id") in self.dialogs:
                intent = payload.get('intent',{}).get('name')
                entities = payload.get('entities',[])
                self.dialogs[payload.get("id")]["intent"] = intent
                self.dialogs[payload.get("id")]["entities"] = entities
                self.write_nlu(self.dialogs[payload.get("id")])
        elif topic == prep + 'dialog/end':
            text = payload.get('text','')
            response = await self.request_get(self.rasa_server+"/conversations/"+site+"/tracker",{})
            # self.log(response)
            events = response.get('events',[])    
       
            self.write_stories(self.dialogs[payload.get("id")])
            

    async def request_get(self,url,json):
        with async_timeout.timeout(10):
            async with aiohttp.ClientSession() as session:
                async with session.get(url,json = json, headers = {'content-type': 'application/json'}) as resp:
                    # print(resp.status)
                    return await resp.json()     
