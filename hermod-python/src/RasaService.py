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
            # self.log('subscribe to {}'.format(sub))
            self.client.subscribe(sub)
        
        while True:
            try:
                response = requests.get(self.rasa_server)
                if response.status_code == 200:
                    break
                time.sleep(3)
            except: 
                pass
        self.client.publish('hermod/rasa/ready',json.dumps({}))
                   
    def on_message(self, client, userdata, msg):
        topic = "{}".format(msg.topic)
        parts = topic.split("/")
        site = parts[1]
        # self.log("MESSAGE {}".format(topic))
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
                response = requests.post(self.rasa_server+"model/parse",json.dumps({"text":text,"message_id":site}))
                self.client.publish('hermod/'+site+'/nlu/intent',json.dumps(response.json()))
        
        elif topic == 'hermod/' + site + '/intent':
            if payload:
                self.handle_intent(topic,site,payload)

        elif topic == 'hermod/' + site + '/tts/finished':
            self.client.unsubscribe('hermod/'+site+'tts/finished')
            self.finish(site)
            
        elif topic == 'hermod/' + site + '/dialog/ended':
            self.reset_tracker(site)             
   
    
    def reset_tracker(self,site):
        self.log('reset tracker '+site)
        #requests.post(self.rasa_server+"conversations/"+site+"/tracker/events",json.dumps({"event": "restart"}))
        requests.put(self.rasa_server+"conversations/"+site+"/tracker/events",json.dumps([]))

    def handle_intent(self,topic,site,payload):
        self.client.publish('hermod/'+site+'/core/started',json.dumps({}));
        response = requests.post(self.rasa_server+"conversations/"+site+"/trigger_intent",json.dumps({"name": payload.get('intent').get('name'),"entities": payload.get('entities')}))
        messages = response.json().get('messages')
        if messages:
            message = '. '.join(map(lambda x: x.get('text',''   ),messages))
            self.client.subscribe('hermod/'+site+'/tts/finished')
            self.client.publish('hermod/'+site+'/tts/say',json.dumps({"text":message}))
        else:
            self.finish(site)
        
    def finish(self,site):
        self.log('finish')
        response = requests.get(self.rasa_server+"conversations/"+site+"/tracker",json.dumps({}))
        self.log(response.json())
        events = response.json().get('events')
        # end conversation
        if len(events) > 0 and events[len(events) - 2].get('event') == 'action'  and events[len(events) - 2].get('name') == 'action_end':
            # restart hotword
            self.client.publish('hermod/'+site+'/dialog/end',json.dumps({}));
        else:
            # restart asr
            self.client.publish('hermod/'+site+'/dialog/continue',json.dumps({}));
    
