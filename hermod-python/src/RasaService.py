from mqtt_service import MqttService
import sys
import time
import json
import requests


class RasaService(MqttService):

    def __init__(
            self,
            config
    ):
        super(
            RasaService,
            self).__init__(config)
        self.config = config
        # self.recursion_depth = {}
        self.rasa_server = self.config['services']['RasaService'].get('rasa_server','http://localhost:5005/')
        
        self.subscribe_to = 'hermod/+/dialog/ended,hermod/+/nlu/parse,hermod/+/intent,hermod/+/dialog/started'
        
        
    def on_connect(self, client, userdata, flags, result_code):
        # self.log("Connected with result code {}".format(result_code))
        # SUBSCRIBE
        for sub in self.subscribe_to.split(","):
            self.log('RASA subscribe to {}'.format(sub))
            self.client.subscribe(sub)
        
        while True:
            self.log('check rasa service '+self.rasa_server)
            try:
                response = requests.get(self.rasa_server)
                if response.status_code == 200:
                    self.log('FOUND rasa service')
                    break
                time.sleep(3)
            except Exception as e: 
                self.log(e)
                pass
            time.sleep(3)
        self.client.publish('hermod/rasa/ready',json.dumps({}))
                   
    def on_message(self, client, userdata, msg):
        topic = "{}".format(msg.topic)
        parts = topic.split("/")
        site = parts[1]
        self.log("RASA MESSAGE {}".format(topic))
        ps = str(msg.payload, encoding='utf-8')
        payload = {}
        text = ''
        try:
            payload = json.loads(ps)
        except BaseException:
            pass
        self.log(payload)
        if topic == 'hermod/' + site + '/nlu/parse':
            if payload: 
                text = payload.get('query')
                # self.log('PARSE REQUEST')
                # self.log(text)
                # self.log(self.rasa_server+"model/parse")
                # self.log(json.dumps({"text":text,"message_id":site})    )
                response = requests.post(self.rasa_server+"model/parse",data = json.dumps({"text":text,"message_id":site}),headers = {'content-type': 'application/json'})
                self.client.publish('hermod/'+site+'/nlu/intent',json.dumps(response.json()))
        
        elif topic == 'hermod/' + site + '/intent':
            if payload:
                # self.log('HANDLE INTENT')
                self.handle_intent(topic,site,payload)

        elif topic == 'hermod/' + site + '/tts/finished':
            self.client.unsubscribe('hermod/'+site+'/tts/finished')
            self.finish(site)
            
        elif topic == 'hermod/' + site + '/dialog/ended':
            self.reset_tracker(site)             
   
    
    def reset_tracker(self,site):
        self.log('reset tracker '+site)
        #requests.post(self.rasa_server+"conversations/"+site+"/tracker/events",json.dumps({"event": "restart"}))
        requests.put(self.rasa_server+"conversations/"+site+"/tracker/events",json.dumps([]),headers = {'content-type': 'application/json'})

    def handle_intent(self,topic,site,payload):
        self.client.publish('hermod/'+site+'/core/started',json.dumps({}));
        # self.log('SEND RASA TRIGGER {}  {} '.format(self.rasa_server+"conversations/"+site+"/trigger_intent",json.dumps({"name": payload.get('intent').get('name'),"entities": payload.get('entities')})))
        response = requests.post(self.rasa_server+"conversations/"+site+"/trigger_intent",json.dumps({"name": payload.get('intent').get('name'),"entities": payload.get('entities')}),headers = {'content-type': 'application/json'})
        # self.log('resp RASA TRIGGER')
        messages = response.json().get('messages')
        # self.log('HANDLE INTENT MESSAGES')
        self.log(messages)
        if messages:
            message = '. '.join(map(lambda x: x.get('text',''   ),messages))
            self.client.subscribe('hermod/'+site+'/tts/finished')
            self.client.publish('hermod/'+site+'/tts/say',json.dumps({"text":message}))
            # send action messages from server actions to client action
            for message in messages:
                self.log(message)
                if message.action:
                    self.client.publish('hermod/'+site+'/action',json.dumps(message.action))
        else:
            self.finish(site)
        
    def finish(self,site):
        #self.log('finish')
        response = requests.get(self.rasa_server+"conversations/"+site+"/tracker",json.dumps({}))
        #self.log(response.json())
        events = response.json().get('events')
        # end conversation
        if len(events) > 0 and events[len(events) - 2].get('event') == 'action'  and events[len(events) - 2].get('name') == 'action_end':
            # restart hotword
            self.client.publish('hermod/'+site+'/dialog/end',json.dumps({}));
        else:
            # restart asr
            self.client.publish('hermod/'+site+'/dialog/continue',json.dumps({}));
    
