from MqttService import MqttService
import sys
import time
import json
import requests
import aiohttp
import asyncio
import async_timeout

from rasa.core.agent import Agent
from rasa.core.tracker_store import InMemoryTrackerStore
from rasa.core.events import SlotSet
from rasa.core.channels.channel import UserMessage
from rasa.core.interpreter import NaturalLanguageInterpreter, RegexInterpreter, RasaNLUInterpreter
from rasa.core.utils import EndpointConfig

from rasa.exceptions import ModelNotFound
from rasa.model import (
    get_model_subdirectories,
    get_latest_model,
    unpack_model,
    get_model,
)


# async def run():
    # print("Your bot is ready to talk! Type your messages here or send 'stop'")
    # while True:
        # a = input()
        # if a == 'stop':
            # break
            
        # nlu = await agent.parse_message_using_nlu_interpreter(a)
        # print(nlu)    
        
        # responses = await agent.handle_text(a, sender_id='webfred')
        # for response in responses:
            # print(response["text"])
        
        # tracker = tracker_store.get_or_create_tracker('webfred')
        # tracker.update(SlotSet("place","JAPAN"))
        # tracker_store.save(tracker)
        # print(tracker.current_slot_values())

# loop = asyncio.get_event_loop()  
# loop.run_until_complete(run())


class RasaServiceLocal(MqttService):

    def __init__(
            self,

            config,
            loop
    ):
        super(
            RasaServiceLocal,
            self).__init__(config,loop)
        self.config = config
        # self.recursion_depth = {}
        # self.rasa_server = self.config['services']['RasaServiceLocal'].get('rasa_server','http://localhost:5005/')
        self.subscribe_to = 'hermod/+/rasa/get_domain,hermod/+/rasa/set_slots,hermod/+/dialog/ended,hermod/+/dialog/init,hermod/+/nlu/externalparse,hermod/+/nlu/parse,hermod/+/intent,hermod/+/intent,hermod/+/dialog/started'
        # self.log("ENDPOINT:"+config.get('rasa_actions_url',''))
        # self.log(config)
        model_path = get_model('/app/rasa/models/model.tar.gz')
        endpoint = EndpointConfig(config['services']['RasaServiceLocal'].get('rasa_actions_url'))
        # print('loading model') 
        domain = 'domain.yml'
        self.tracker_store = InMemoryTrackerStore(domain)
        # self.interpreter = NaturalLanguageInterpreter.create(interpreter)
        regex_interpreter = RegexInterpreter()
        # print(await a.parse('/ask_time{"fred":"joe"}'))
        self.text_interpreter = RasaNLUInterpreter(model_path+'/nlu') #, action_endpoint = endpoint)
        #print(await a.parse('what is the capital of Germany'))
        
        
        self.agent = Agent.load(model_path, action_endpoint = endpoint, tracker_store=self.tracker_store, interpreter = regex_interpreter)
        # from rasa.core.interpreter import RegexInterpreter
        # self.agent.interpreter = RegexInterpreter()
        
    async def connect_hook(self):
        # self.log("Connected with result code {}".format(result_code))
        # SUBSCRIBE
        for sub in self.subscribe_to.split(","):
            # self.log('RASA subscribe to {}'.format(sub))
            await self.client.subscribe(sub)
        await self.client.publish('hermod/rasa/ready',json.dumps({}))
                 
        # while True:
            # # self.log('check rasa service '+self.rasa_server)
            # try:
                # # self.log('rasa service GET '+self.rasa_server) 
                # # response = requests.get(self.rasa_server)
                # # self.log('rasa service GOT '+self.rasa_server)
                # if response.status_code == 200:
                    # self.log('FOUND rasa service')
                    # await self.client.publish('hermod/rasa/ready',json.dumps({}))
                    # break
                # await asyncio.sleep(3)
            # except Exception as e: 
                # self.log(e)
                # pass
            # await asyncio.sleep(3000)
            # time.sleep(2)
        
                   
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
        if topic == 'hermod/' + site + '/rasa/set_slots':
            if payload: 
                await self.set_slots(site,payload)
                
        elif topic == 'hermod/' + site + '/nlu/parse':
            if payload: 
                await self.client.publish('hermod/'+site+'/display/startwaiting',json.dumps({}))
                text = payload.get('query')
                await self.nlu_parse_request(site,text,payload)
                await self.client.publish('hermod/'+site+'/display/stopwaiting',json.dumps({}))
            
        elif topic == 'hermod/' + site + '/nlu/externalparse':
            if payload: 
                text = payload.get('query')
                await self.nlu_external_parse_request(site,text,payload)
        
        elif topic == 'hermod/' + site + '/intent':
            
            if payload:
                await self.client.publish('hermod/'+site+'/display/startwaiting',json.dumps({}))
                await self.handle_intent(topic,site,payload)
                await self.client.publish('hermod/'+site+'/display/stopwaiting',json.dumps({}))

        elif topic == 'hermod/' + site + '/tts/finished':
            await self.client.unsubscribe('hermod/'+site+'/tts/finished')
            await self.finish(site,payload)
            
        elif topic == 'hermod/' + site + '/dialog/started':
            await self.reset_tracker(site) 
        
        elif topic == 'hermod/' + site + '/ ':
            # save dialog init data to slots for custom actions
            tracker = self.tracker_store.get_or_create_tracker(site)
            tracker.update(SlotSet("hermod_client",json.dumps(payload)))
            self.tracker_store.save(tracker)
        
        elif topic == 'hermod/' + site + '/rasa/get_domain':
            await self.send_domain(site)     
        
        elif topic == 'hermod/' + site + '/core/ended':
            await self.send_story(site,payload)
            
    async def send_story(self,site,payload):
        text = payload.get('text','')
        tracker = self.tracker_store.get_or_create_tracker(site)
        response = tracker.export_stories()
        # response = await self.request_get_text(self.rasa_server+"/conversations/"+site+"/story",{})
        await self.client.publish('hermod/'+site+'/rasa/story',json.dumps({'id':payload.get('id',''),'story':response}))
        

    async def send_domain(self,site):
        # print('SEND DOMAIN')
        # # response = await self.request_get(self.rasa_server+"/domain",{},{"Accept": "application/json"})
        # print(response)
        # if response:
            # print('SEND DOMAIN REAL')
        await self.client.publish('hermod/'+site+'/rasa/domain',json.dumps(self.agent.domain.as_dict()))
        
    
    
        
    async def reset_tracker(self,site):
        pass
        # self.log('RESSET tracker '+site)
        # tracker = self.tracker_store.get_or_create_tracker(site)
        # tracker._reset()
        # pass
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
        await self.client.publish('hermod/'+site+'/core/started',json.dumps(payload));
        # self.log('SEND RASA TRIGGER {}  {} '.format(self.rasa_server+"/conversations/"+site+"/trigger_intent",json.dumps({"name": payload.get('intent').get('name'),"entities": payload.get('entities')})))
        #response = requests.post(self.rasa_server+"/conversations/"+site+"/trigger_intent",json.dumps({"name": payload.get('intent').get('name'),"entities": payload.get('entities')}),headers = {'content-type': 'application/json'})
        # self.log('HANDLE INTENT '+site)
        # self.log(payload)
        if payload:
            intent_name = payload.get('intent',{}).get('name','')
            entities_json = {}
            entities = payload.get('entities',[])
            # print('entities')
            # print(entities)
            for entity in entities:
                # print('entity')
                # print(entity)
                entities_json[entity.get('entity')] = entity.get('value')
            intent_json = "/" + intent_name+json.dumps(entities_json)
            self.log(['INTENT JSON',intent_json])
            # messages = await self.agent.handle_message(UserMessage(parse_data = payload, sender_id=site))
            messages=[]
            responses = await self.agent.handle_text(intent_json,sender_id=site,  output_channel=None)
            for response in responses:
                messages.append(response.get("text"))
                # print(response.get("text"))
            # response =await self.request_post(self.rasa_server+"/conversations/"+site+"/trigger_intent",{"name": payload.get('intent').get('name'),"entities": payload.get('entities')})
            # # self.log('resp RASA TRIGGER')
            # # self.log(response)
            # messages = response.get('messages')
            self.log('HANDLE INTENT MESSAGES')
            # self.log(messages)
            if len(messages) > 0:
                # self.log('SEND MESSAGES')
                message = '. '.join(messages) 
                #map(lambda x: x.get('text',''   ),messages))
                # self.log(message)
                await self.client.subscribe('hermod/'+site+'/tts/finished')
                # self.log('SEND MESSAGES sub finish')
                await self.client.publish('hermod/'+site+'/tts/say',json.dumps({"text":message, "id":payload.get('id','')}))
                # self.log('SEND MESSAGES sent text '+message)
                # send action messages from server actions to client action
                # for message in messages:
                    # self.log(message)
                    # # if hasattr(message,'action') and message.action:
                        # # await self.client.publish('hermod/'+site+'/action',json.dumps(message.action))
            else:
                # self.log('SEND finish')
                await self.finish(site,payload)
        else:
            self.log('ERROR RASA CORE HANDLER - no payload')
            
            await self.finish(site,payload)
    
    async def set_slots(self,site,payload):
        print('RASA LOCAL SETSLOT loc' + site)
                
        tracker = self.tracker_store.get_or_create_tracker(site)
        if payload :
            #tracker.current_slot_values();
            for slot in payload.get('slots',[]):
                print('SETSLOT loc')
                print([slot])
                tracker.update(SlotSet(slot.get('slot'),slot.get('value')))
            self.tracker_store.save(tracker)
            
            await self.client.publish('hermod/'+site+'/dialog/slots',json.dumps(tracker.current_slot_values()));

    async def send_slots(self,site):
        # self.log('SEND SLOTS localS')
        tracker = self.tracker_store.get_or_create_tracker(site)
        slots = tracker.current_slot_values();
        # self.log(slots)
        await self.client.publish('hermod/'+site+'/dialog/slots',json.dumps(slots));
    
        
    async def finish(self,site,payload):
        #self.log('finish')
        #response = requests.get(self.rasa_server+"/conversations/"+site+"/tracker",json.dumps({}))
        tracker = self.tracker_store.get_or_create_tracker(site)
        # tracker.update(SlotSet("hermod_client",json.dumps(payload)))
        # self.tracker_store.save(tracker)
        # response = await self.request_get(self.rasa_server+"/conversations/"+site+"/tracker",{})
        # events = response.get('events',[])
        # slots = response.get('slots',[])
        slots = tracker.current_slot_values();
        # self.log('RASA TRAKER FINSIH')
        # self.log(slots)
        # self.log('RASA TRAKER')
        
        # end conversation
        # await self.client.publish('hermod/'+site+'/dialog/slots',json.dumps(slots));
        # response['id'] = payload.get("id","")
        # self.log('RASA TRAKER ID'+str(response['id']))
        
        #if len(events) > 0 and events[len(events) - 2].get('event') == 'action'  and events[len(events) - 2].get('name') == 'action_end':
        if  slots.get('hermod_force_continue',False)  == 'true':
            # self.log('RASA TRAKER restart mic')
            # await self.request_post(self.rasa_server+"/conversations/"+site+"/tracker/events",[{"event": "slot", "name": 'hermod_force_continue', "value": ''},{"event": "slot", "name": 'hermod_force_end', "value": ''}])
            tracker.update(SlotSet("hermod_force_continue",None))
            tracker.update(SlotSet("hermod_force_end",None))
            self.tracker_store.save(tracker)
            await self.client.publish('hermod/'+site+'/dialog/continue',json.dumps({"id":payload.get("id","")}));
        elif  slots.get('hermod_force_end',False) == 'true':
            # self.log('RASA TRAKER restart hotword')
            # await self.request_post(self.rasa_server+"/conversations/"+site+"/tracker/events",[{"event": "slot", "name": 'hermod_force_continue', "value": ''},{"event": "slot", "name": 'hermod_force_end', "value": ''}])
            tracker.update(SlotSet("hermod_force_continue",None))
            tracker.update(SlotSet("hermod_force_end",None))
            self.tracker_store.save(tracker)
            await self.client.publish('hermod/'+site+'/dialog/end',json.dumps({"id":payload.get("id","")}));
        #elif len(events) > 0 and events[len(events) - 2].get('event') == 'action'  and events[len(events) - 2].get('name') == 'action_continue':
        # fallback to configured default
        else:
            # self.log('RASA TRAKER fallback to default')
            if (self.config.get('keep_listening') == "true"):
                await self.client.publish('hermod/'+site+'/dialog/continue',json.dumps({"id":payload.get("id","")}));
            else:
                await self.client.publish('hermod/'+site+'/dialog/end',json.dumps({"id":payload.get("id","")}));
        await self.send_slots(site)  
        await self.client.publish('hermod/'+site+'/core/ended',json.dumps(payload));      
# event_loop = asyncio.get_event_loop()
# Then later, inside your Thread:

# asyncio.ensure_future(my_coro(), loop=event_loop)

    async def nlu_parse_request(self,site,text,payload):
        response =  await self.text_interpreter.parse(text)
        response['id'] = payload.get('id','')
        #response = await self.agent.parse_message_using_nlu_interpreter(text)
        await self.client.publish('hermod/'+site+'/nlu/intent',json.dumps(response))

    async def nlu_external_parse_request(self,site,text,payload):
        response =  await self.text_interpreter.parse(text)
        response['id'] = payload.get('id','')
        #response = await self.agent.parse_message_using_nlu_interpreter(text)
        await self.client.publish('hermod/'+site+'/nlu/externalintent',json.dumps(response))
        
        
        # self.log('PARSE RESPONSE sent')

    # async def request_get(self,url,json):
        # with async_timeout.timeout(10):
            # async with aiohttp.ClientSession() as session:
                # async with session.get(url,json = json, headers = {'content-type': 'application/json'}) as resp:
                    # # print(resp.status)
                    # return await resp.json()

    # async def request_post(self,url,json):
        # with async_timeout.timeout(25):
            # async with aiohttp.ClientSession() as session:
                # async with session.post(url,json=json,headers = {'content-type': 'application/json'}) as resp:
                    # # print(resp.status)
                    # return await resp.json()
            
    # async def request_put(self,url,json):
        # with async_timeout.timeout(10):
            # async with aiohttp.ClientSession() as session:
                # async with session.put(url,json=json,headers = {'content-type': 'application/json'}) as resp:
                    # # print(resp.status)
                    # return await resp.json()
            
            
            # async with session.get(url) as response:
                # return await response.text()

    # async def main():
        # async with aiohttp.ClientSession() as session:
            # html = await self.fetch(session, 'http://python.org')
            # print(html)
