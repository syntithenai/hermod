import json
import time
import os
import pyaudio
import wave
import io

from random import seed
from random import randint
# seed random number generator
seed(1)

from mqtt_service import MqttService

 # ////hotword/detected => dialog/end then wait dialog/ended then dialog/started, microphone/start, asr/start
 # ////dialog/continue => if text then tts/say then wait tts/finished then  microphone/start, asr/start    ELSE microphone/start, asr/start
 
 # ////dialog/start => if text then dialog/started, asr/stop, nlu/parse ELSE  dialog/started, microphone/start, asr/start
 # ////asr/text => asr/stop, hotword/stop, microphone/stop, nlu/parse
 # ////nlu/intent => intent
 # ////nlu/fail => dialog/end
 # ////dialog/end => dialog/ended, microphone/start, hotword/start
 # ////router/action => action

class dialog_manager_service(MqttService):
  
    def __init__(
            self,
            config
            ):
        super(dialog_manager_service, self).__init__(config['mqtt_hostname'],config['mqtt_port'],config['site'])
        self.config = config
        self.subscribe_to='hermod/+/dialog/start,hermod/+/asr/text,hermod/+/nlu/intent,hermod/+/nlu/fail,hermod/+/dialog/end,hermod/+/router/action,hermod/+/hotword/detected,hermod/+/dialog/continue'
        self.dialogs = {} 
        self.waiters = {}
        self.subscriptions = {}
        # self.log('DM CON')
     
    def send_and_wait(self,topic,message,waitFor,callback):
        # id from message or random
        # self.log('send {} and wait for {} '.format(topic,waitFor))
        # dialogId = message.get('id',-1)
        # #self.log('send1 {}'.format(dialogId))
        # if int(dialogId) <= 0: 
            # #self.log('send1.2 gen id')
            # dialogId = randint(0, 100000000)
        # #self.log('send2 {} '.format(dialogId))
        # message['id'] = dialogId
        # key = waitFor+'-'+str(dialogId)
        #self.log('send and wait {}'.format(key))
        # push callback to waiters and subscribe
        self.waiters[waitFor] = callback
        # keep a tally of subscriptions/topic and limit real subscriptions to one
        #self.log('added waiter {}'.format(key))
        sub_count =  0
        if waitFor in self.subscriptions:
            sub_count = self.subscriptions.get(waitFor)
        #self.log('ssubcount1 {}'.format(sub_count))
        sub_count = sub_count + 1
        #self.log('ssubcount 2 {}'.format(sub_count))
        self.subscriptions[waitFor] = sub_count
        # only subscribe for first waiter
        if (sub_count < 2):
            #self.log('mqtt sub')
            self.client.subscribe(waitFor)
        #self.log('nowpub {}'.format(topic))
        # self.log(self.waiters)
        # self.log(self.subscriptions)
        self.client.publish(topic,json.dumps(message))
        
    def handle_waiters(self,prep,topic,message):
        # self.log('handle waiters {} '.format(topic))
        # self.log(self.waiters)
        #if ('id' in message):
            # self.log('id {}'.format(message.get('id')))
    
        seekTopic = topic # + '-' + str(message.get('id'))
        # self.log('seek {}'.format(seekTopic))
        # self.log(self.waiters)
        if seekTopic in self.waiters:
            # self.log('have callback')
            # remove waiter and decrement (and possibly) unsub subscriptions
            callback = self.waiters.pop(seekTopic,None)
            
            sub_count = self.subscriptions.get(topic)
            self.subscriptions[topic] = sub_count - 1
            if (sub_count == 1):
                # don't unsubscribe dm constant topics
                parts = self.subscribe_to.split(",")
                # self.log('unsub last callback {}'.format(parts))
                if (topic not in parts):
                    # self.log('really unsub')
                    self.client.unsubscribe(topic)
            callback(prep,topic,message)
        
   
    def callback_hotword_dialog_ended(self,prep,topic,message):
        # self.log('hw callback')
        #dialog/started, microphone/start, asr/start
        # dialogId = randint(0, 100000000)
        self.client.publish(prep + 'dialog/started',json.dumps({})) #"id":dialogId}))
        self.client.publish(prep + 'microphone/start',json.dumps({}))
        self.client.publish(prep + 'asr/start',json.dumps({}))
        
    def callback_dmcontinue_ttsfinished(self,prep,topic,message):
        # self.log('dm callback')
        #microphone/start, asr/start
        self.client.publish(prep + 'microphone/start',json.dumps({}))
        self.client.publish(prep + 'asr/start',json.dumps({}))
   
    # def generate_dialog_id(self):
        # dialogId = randint(0, 100000000)
        # self.dialogs[dialogId] = {}
        # return dialogId
    
    def start_dialog(self,site,text):
        prep = 'hermod/' + site + '/'
        # if starting with text, dive straight into nlu/parse
        # self.log('start dialog {} {}'.format(prep,text))
        if len(text) > 0:
            self.log('start dialog with text')
            #dialogId = self.generate_dialog_id()
            # self.log('start dialog publish id - {}'.format(dialogId))
            self.client.publish(prep + 'dialog/started',json.dumps({}))
            # self.log('start dialog with text2')
            self.client.publish(prep + 'asr/stop',json.dumps({}))
            # self.log('start dialog with text3')
            self.client.publish(prep + 'microphone/stop',json.dumps({}))
            # self.log('start dialog with text4')
            self.client.publish(prep + 'nlu/parse',json.dumps({"text":text}))
            # self.log('published')
        # otherwise start dialog and asr
        else:
            self.log('start dialog no text')
            #dialogId = self.generate_dialog_id()
            
            self.client.publish(prep + 'dialog/started',json.dumps({}))
            self.client.publish(prep + 'microphone/start',json.dumps({}))
            self.client.publish(prep + 'asr/start',json.dumps({}))
            # self.log('end dialog no text')
           
    def on_message(self, client, userdata, msg):
        #self.log('ONMESS')
        topic = "{}".format(msg.topic)
        parts = topic.split("/")
        site = parts[1]
        payload = {}
        try:
            payload = json.loads(msg.payload)
        except:
            pass
        # self.log('payload')
        # self.log(payload)
        text = payload.get('text')
        prep = 'hermod/'+site+'/'
        self.log("DM MESSAGE {} - {}".format(site,topic))
        
        # first handle temporary subscription bindings
        self.handle_waiters(prep,topic,payload)
        
        # now handle main subscription bindings
        if topic == prep +'hotword/detected':
             self.send_and_wait(prep + 'dialog/end',payload,prep + 'dialog/ended',self.callback_hotword_dialog_ended)
             #self.log('dm hw det2')
             
        elif topic == prep +'dialog/continue':
             #self.log('dm continue')
             if (len(text) > 0):
                 self.send_and_wait(prep + 'tts/say',payload,prep + 'tts/finished',self.callback_dmcontinue_ttsfinished)
             else:
                 self.client.publish(prep + 'microphone/start',json.dumps({}))
                 self.client.publish(prep + 'asr/start',json.dumps({}))    
                 #if text then tts/say then wait tts/finished then  microphone/start, asr/start    ELSE microphone/start, asr/start
             
        elif topic == prep +'dialog/start':
            #self.log('dm start')
            self.start_dialog(site,text)

        elif topic == prep +'asr/text':
            self.client.publish(prep + 'asr/stop',json.dumps({}))
            self.client.publish(prep + 'hotword/stop',json.dumps({}))
            self.client.publish(prep + 'microphone/stop',json.dumps({}))
            self.client.publish(prep + 'nlu/parse',json.dumps({"text":text}))

        elif topic == prep +'nlu/intent':
            self.client.publish(prep + 'intent',json.dumps(payload))
        
        elif topic == prep +'nlu/fail':
            self.client.publish(prep + 'dialog/end',json.dumps(payload))
        
        elif topic == prep +'dialog/end':
            # dialogId = payload.get('id', 0)
            # if dialogId > 0 and dialogId in self.dialogs:
                # del self.dialogs[dialogId]
            self.client.publish(prep + 'dialog/ended',json.dumps(payload))
            self.client.publish(prep + 'microphone/start',json.dumps({}))
            self.client.publish(prep + 'hotword/start',json.dumps({}))
        
        elif topic == prep +'router/action':
            self.client.publish(prep + 'action',json.dumps(payload))
            
     
