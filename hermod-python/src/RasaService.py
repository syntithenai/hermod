from MqttService import MqttService
import sys
import time
import json
import requests
import aiohttp
import asyncio
import async_timeout


class RasaService(MqttService):

    def __init__(
            self,
            config,
            loop
    ):
        super(
            RasaService,
            self).__init__(config,loop)
        self.config = config
        # self.recursion_depth = {}
        self.rasa_server = self.config['services']['RasaService'].get('rasa_server','http://localhost:5005/')
        self.subscribe_to = 'hermod/+/dialog/ended,hermod/+/dialog/init,hermod/+/nlu/parse,hermod/+/intent,hermod/+/intent,hermod/+/dialog/started'
        
        
    async def connect_hook(self):
        # self.log("Connected with result code {}".format(result_code))
        # SUBSCRIBE
        for sub in self.subscribe_to.split(","):
            # self.log('RASA subscribe to {}'.format(sub))
            await self.client.subscribe(sub)
        
        while True:
            # self.log('check rasa service '+self.rasa_server)
            try:
                # self.log('rasa service GET '+self.rasa_server)
                response = requests.get(self.rasa_server)
                # self.log('rasa service GOT '+self.rasa_server)
                if response.status_code == 200:
                    self.log('FOUND rasa service')
                    await self.client.publish('hermod/rasa/ready',json.dumps({}))
                    break
                asyncio.sleep(3)
            except Exception as e: 
                self.log(e)
                pass
            await asyncio.sleep(3000)
            time.sleep(2)
        
                   
    async def on_message(self, msg):
        topic = "{}".format(msg.topic)
        parts = topic.split("/")
        site = parts[1]
        #self.log("RASA MESSAGE {}".format(topic))
        ps = str(msg.payload, encoding='utf-8')
        payload = {}
        text = ''
        try:
            payload = json.loads(ps)
        except BaseException:
            pass
        # self.log(payload)
        if topic == 'hermod/' + site + '/nlu/parse':
            if payload: 
                await self.client.publish('hermod/'+site+'/display/startwaiting',json.dumps({}))
                text = payload.get('query')
                await self.nlu_parse_request(site,text,payload)
                await self.client.publish('hermod/'+site+'/display/stopwaiting',json.dumps({}))
            
        elif topic == 'hermod/' + site + '/intent':
            if payload:
                await self.client.publish('hermod/'+site+'/display/startwaiting',json.dumps({}))
                # self.log('HANDLE INTENT')
                await self.handle_intent(topic,site,payload)
                await self.client.publish('hermod/'+site+'/display/stopwaiting',json.dumps({}))

        elif topic == 'hermod/' + site + '/tts/finished':
            await self.client.unsubscribe('hermod/'+site+'/tts/finished')
            await self.finish(site,payload)
            
        elif topic == 'hermod/' + site + '/dialog/started':
            # await self.client.publish('hermod/'+site+'/display/stopwaiting',{})
            await self.reset_tracker(site) 
        
        elif topic == 'hermod/' + site + '/dialog/init':
            #pass
            # save dialog init data to slots for custom actions
            await self.request_post(self.rasa_server+"/conversations/"+site+"/tracker/events",[{"event": "slot", "name": "hermod_client", "value": json.dumps(payload)}])
   
    
    async def reset_tracker(self,site):
        pass
        # backup slots
        # response = await self.request_get(self.rasa_server+"/conversations/"+site+"/tracker",{})
        # self.log('TRAKER BEFORE')
        # self.log(response.get('slots',''))
        
        # # reset tracker
        # # await self.request_put(self.rasa_server+"/conversations/"+site+"/tracker/events",[])
        # # self.log('RESSET tracker '+site)
        # #await self.request_post(self.rasa_server+"/conversations/"+site+"/tracker/events",[{"event": "restart"}])
        
        # # restore slots ?? this should work with event 
        # slotsets = []
        # slots = response.get('slots',[])
        # for slot in slots:
            # if slots[slot]:
                # slotsets.append({"event": "slot", "name": slot, "value": slots[slot]})
        # self.log('RESTORE SLOTS')
        # self.log(slotsets)
        # await self.request_put(self.rasa_server+"/conversations/"+site+"/tracker/events",slotsets)
        
        # # check and debug
        # response = await self.request_get(self.rasa_server+"/conversations/"+site+"/tracker",{})
        # self.log('TRAKER after')
        # self.log(response.get('slots',''))
        
        #requests.post(self.rasa_server+"/conversations/"+site+"/tracker/events",json.dumps({"event": "restart"}))
        # #requests.put(self.rasa_server+"/conversations/"+site+"/tracker/events",json.dumps([]),headers = {'content-type': 'application/json'})
        
    async def handle_intent(self,topic,site,payload):
        await self.client.publish('hermod/'+site+'/core/started',json.dumps({}));
        self.log('SEND RASA TRIGGER {}  {} '.format(self.rasa_server+"/conversations/"+site+"/trigger_intent",json.dumps({"name": payload.get('intent').get('name'),"entities": payload.get('entities')})))
        #response = requests.post(self.rasa_server+"/conversations/"+site+"/trigger_intent",json.dumps({"name": payload.get('intent').get('name'),"entities": payload.get('entities')}),headers = {'content-type': 'application/json'})
        response =await self.request_post(self.rasa_server+"/conversations/"+site+"/trigger_intent",{"name": payload.get('intent').get('name'),"entities": payload.get('entities')})
        self.log('resp RASA TRIGGER')
        self.log(response)
        messages = response.get('messages')
        self.log('HANDLE INTENT MESSAGES')
        self.log(messages)
        if messages and len(messages) > 0:
            # self.log('SEND MESSAGES')
            message = '. '.join(map(lambda x: x.get('text',''   ),messages))
            # self.log(message)
            await self.client.subscribe('hermod/'+site+'/tts/finished')
            self.log('SEND MESSAGES sub finish')
            await self.client.publish('hermod/'+site+'/tts/say',json.dumps({"text":message, "id":payload.get('id','')}))
            self.log('SEND MESSAGES sent text '+message)
            # send action messages from server actions to client action
            # for message in messages:
                # self.log(message)
                # # if hasattr(message,'action') and message.action:
                    # # await self.client.publish('hermod/'+site+'/action',json.dumps(message.action))
        else:
            # self.log('SEND finish')
            await self.finish(site,payload)
        
    async def finish(self,site,payload):
        #self.log('finish')
        #response = requests.get(self.rasa_server+"/conversations/"+site+"/tracker",json.dumps({}))
        response = await self.request_get(self.rasa_server+"/conversations/"+site+"/tracker",{})
        events = response.get('events',[])
        slots = response.get('slots',[])
        self.log('RASA TRAKER FINSIH')
        self.log(slots)
        self.log('RASA TRAKER')
        
        # end conversation
        # await self.client.publish('hermod/'+site+'/dialog/slots',json.dumps(slots));
        # response['id'] = payload.get("id","")
        # self.log('RASA TRAKER ID'+str(response['id']))
        
        #if len(events) > 0 and events[len(events) - 2].get('event') == 'action'  and events[len(events) - 2].get('name') == 'action_end':
        if  slots.get('hermod_force_continue',False)  == 'true':
            self.log('RASA TRAKER restart mic')
            await self.request_post(self.rasa_server+"/conversations/"+site+"/tracker/events",[{"event": "slot", "name": 'hermod_force_continue', "value": ''},{"event": "slot", "name": 'hermod_force_end', "value": ''}])
            await self.client.publish('hermod/'+site+'/dialog/continue',json.dumps({"id":payload.get("id","")}));
        elif  slots.get('hermod_force_end',False) == 'true':
            self.log('RASA TRAKER restart hotword')
            await self.request_post(self.rasa_server+"/conversations/"+site+"/tracker/events",[{"event": "slot", "name": 'hermod_force_continue', "value": ''},{"event": "slot", "name": 'hermod_force_end', "value": ''}])
            await self.client.publish('hermod/'+site+'/dialog/end',json.dumps({"id":payload.get("id","")}));
        #elif len(events) > 0 and events[len(events) - 2].get('event') == 'action'  and events[len(events) - 2].get('name') == 'action_continue':
        # fallback to configured default
        else:
            self.log('RASA TRAKER fallback to default')
            if (self.config.get('keep_listening') == "true"):
                await self.client.publish('hermod/'+site+'/dialog/continue',json.dumps({"id":payload.get("id","")}));
            else:
                await self.client.publish('hermod/'+site+'/dialog/end',json.dumps({"id":payload.get("id","")}));
                
# event_loop = asyncio.get_event_loop()
# Then later, inside your Thread:

# asyncio.ensure_future(my_coro(), loop=event_loop)

    async def nlu_parse_request(self,site,text,payload):
        self.log('PARSE REQUEST')
        self.log(text)
        self.log(payload)
        # self.log(self.rasa_server+"/model/parse")
        # self.log(json.dumps({"text":text,"message_id":site})    )
        response = await self.request_post(self.rasa_server+"/model/parse",{"text":text,"message_id":site})
        #response = requests.post(self.rasa_server+"/model/parse",data = json.dumps({"text":text,"message_id":site}),headers = {'content-type': 'application/json'})
        self.log('PARSE RESPONSE')
        self.log(response)
        # if payload and 'id' in payload:
            # response['id'] = payload.get('id','')
        self.log('PARSE RESPONSE presend')
        await self.client.publish('hermod/'+site+'/nlu/intent',json.dumps(response))
        self.log('PARSE RESPONSE sent')

    async def request_get(self,url,json):
        with async_timeout.timeout(10):
            async with aiohttp.ClientSession() as session:
                async with session.get(url,json = json, headers = {'content-type': 'application/json'}) as resp:
                    # print(resp.status)
                    return await resp.json()

    async def request_post(self,url,json):
        with async_timeout.timeout(25):
            async with aiohttp.ClientSession() as session:
                async with session.post(url,json=json,headers = {'content-type': 'application/json'}) as resp:
                    # print(resp.status)
                    return await resp.json()
            
    async def request_put(self,url,json):
        with async_timeout.timeout(10):
            async with aiohttp.ClientSession() as session:
                async with session.put(url,json=json,headers = {'content-type': 'application/json'}) as resp:
                    # print(resp.status)
                    return await resp.json()
            
            
            # async with session.get(url) as response:
                # return await response.text()

    # async def main():
        # async with aiohttp.ClientSession() as session:
            # html = await self.fetch(session, 'http://python.org')
            # print(html)
