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
from mqtt_service import MqttService



class DialogManagerService(MqttService):
    """
    Dialog Manager Service Class
    """
    def __init__(
            self,
            config
    ):
        super(
            DialogManagerService,
            self).__init__(config)
        self.config = config
        self.subscribe_to = 'hermod/+/dialog/continue,hermod/+/dialog/start,hermod/+/asr/text,hermod/+/nlu/intent' + \
            ',hermod/+/nlu/fail,hermod/+/dialog/end,hermod/+/router/action,hermod/+/hotword/detected' 
            
        self.dialogs = {}
        self.waiters = {}
        self.subscriptions = {}
    
    def on_connect(self, client, userdata, flags, result_code):
        #self.log("DM Connected with result code {}".format(result_code))
        # SUBSCRIBE
        for sub in self.subscribe_to.split(","):
            self.log('subscribe to {}'.format(sub))
            self.client.subscribe(sub)
        #self.log('dm serv')
        # self.log(self.config['services'])
            
        if self.config['services']['DialogManagerService'] and self.config['services']['DialogManagerService']['initialise']:
            sites = str(self.config['services']['DialogManagerService']['initialise']).split(",")
            for site in sites:
                #self.log('initialise site {}'.format(site))
                self.client.publish('hermod/'+site+'/hotword/activate')
                self.client.publish('hermod/'+site+'/asr/activate')
                self.client.publish('hermod/'+site+'/microphone/start')
                self.client.publish('hermod/'+site+'/hotword/start')

    def send_and_wait(self, topic, message, waitFor, callback):
        # push callback to waiters and subscribe
        self.waiters[waitFor] = callback
        # keep a tally of subscriptions/topic and limit real subscriptions to
        # one
        sub_count = 0
        if waitFor in self.subscriptions:
            sub_count = self.subscriptions.get(waitFor)
        sub_count = sub_count + 1
        self.subscriptions[waitFor] = sub_count
        # only subscribe for first waiter
        if sub_count < 2:
            self.client.subscribe(waitFor)
        self.client.publish(topic, json.dumps(message))

    def handle_waiters(self, prep, topic, message):
        if topic in self.waiters:
            # remove waiter and decrement (and possibly) unsub subscriptions
            callback = self.waiters.pop(topic, None)
            sub_count = self.subscriptions.get(topic)
            self.subscriptions[topic] = sub_count - 1
            if sub_count == 1:
                # don't unsubscribe dm constant topics
                parts = self.subscribe_to.split(",")
                if topic not in parts:
                    self.client.unsubscribe(topic)
            callback(prep, topic, message)

    def callback_hotword_dialog_ended(self, prep, topic, message):
        self.client.publish(prep + 'dialog/started', json.dumps({}))
        self.client.publish(prep + 'asr/start', json.dumps({}))
        self.client.publish(prep + 'microphone/start', json.dumps({}))
        
    def callback_dmcontinue_ttsfinished(self, prep, topic, message):
        self.client.publish(prep + 'asr/start', json.dumps({}))
        self.client.publish(prep + 'microphone/start', json.dumps({}))
        
    def start_dialog(self, site, text):
        prep = 'hermod/' + site + '/'
        # if starting with text, dive straight into nlu/parse
        if len(text) > 0:
            self.client.publish(prep + 'dialog/started', json.dumps({}))
            self.client.publish(prep + 'asr/stop', json.dumps({}))
            self.client.publish(prep + 'microphone/stop', json.dumps({}))
            self.client.publish(prep + 'nlu/parse', json.dumps({"text": text}))
        # otherwise start dialog and asr
        else:
            self.client.publish(prep + 'dialog/started', json.dumps({}))
            self.client.publish(prep + 'microphone/start', json.dumps({}))
            self.client.publish(prep + 'asr/start', json.dumps({}))

    def on_message(self, client, userdata, msg):
        topic = "{}".format(msg.topic)
        parts = topic.split("/")
        site = parts[1]
        payload = {}
        try:
            payload = json.loads(msg.payload)
        except BaseException:
            pass
        text = payload.get('text')
        prep = 'hermod/' + site + '/'
        self.log("DM MESSAGE {} - {}".format(site,topic))

        # first handle temporary subscription bindings
        self.handle_waiters(prep, topic, payload)
        # now handle main subscription bindings
        if topic == prep + 'hotword/detected':
            self.client.publish(prep + 'microphone/stop', json.dumps({}))
            self.send_and_wait(
                prep + 'dialog/end',
                payload,
                prep + 'dialog/ended',
                self.callback_hotword_dialog_ended)

        elif topic == prep + 'dialog/continue':
            
            if text:
                self.send_and_wait(
                    prep + 'tts/say',
                    payload,
                    prep + 'tts/finished',
                    self.callback_dmcontinue_ttsfinished)
            else:
                self.client.publish(prep + 'asr/start', json.dumps({}))
                self.client.publish(prep + 'microphone/start', json.dumps({}))
                
        elif topic == prep + 'dialog/start':
            self.start_dialog(site, text)

        elif topic == prep + 'asr/text':
            self.client.publish(prep + 'asr/stop', json.dumps({}))
            #self.client.publish(prep + 'hotword/stop', json.dumps({}))
            self.client.publish(prep + 'microphone/stop', json.dumps({}))
            self.client.publish(prep + 'nlu/parse', json.dumps({"query": text}))
            
        elif topic == prep + 'nlu/intent':
            self.client.publish(prep + 'intent', json.dumps(payload))

        elif topic == prep + 'nlu/fail':
            self.client.publish(prep + 'dialog/end', json.dumps(payload))

        elif topic == prep + 'dialog/end':
            self.log("DM end")
            self.client.publish(prep + 'dialog/ended', json.dumps({}))
            self.client.publish(prep + 'microphone/start', json.dumps({}))
            self.client.publish(prep + 'hotword/start', json.dumps({}))

     
