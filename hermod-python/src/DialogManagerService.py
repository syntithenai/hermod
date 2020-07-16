"""
Dialog Manager Service Class
"""
import json
import uuid

from MqttService import MqttService

class DialogManagerService(MqttService):
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

"""

    def __init__(
                self,
                config,
                loop
        ):
        """ constructor """
        super(
            DialogManagerService,
            self).__init__(config, loop)
        self.config = config
        self.subscribe_to = 'hermod/+/hotword/detected,hermod/+/dialog/continue,' \
        + 'hermod/+/dialog/init,hermod/+/dialog/start,hermod/+/asr/text' \
        + ',hermod/+/nlu/intent,hermod/+/nlu/fail,hermod/+/dialog/end'
        self.dialogs = {}
        self.waiters = {}
        self.subscriptions = {}

    async def send_and_wait(self, topic, message, wait_for, callback):
        """ subscribe to a topic, send a message and wait for a message from subscribed topic """
        # push callback to waiters and subscribe
        self.waiters[wait_for] = callback
        # keep a tally of subscriptions/topic and limit real subscriptions to one
        sub_count = 0
        if wait_for in self.subscriptions:
            sub_count = self.subscriptions.get(wait_for)
        sub_count = sub_count + 1
        self.subscriptions[wait_for] = sub_count
        # only subscribe for first waiter
        if sub_count < 2:
            await self.client.subscribe(wait_for)
        await self.client.publish(topic, json.dumps(message))

    async def handle_waiters(self, prep, topic):
        """ callback for subscribed topic send and wait """
        if topic in self.waiters:
            # remove waiter and decrement (and possibly) unsub subscriptions
            callback = self.waiters.pop(topic, None)
            sub_count = self.subscriptions.get(topic)
            self.subscriptions[topic] = sub_count - 1
            if sub_count == 1:
                # don't unsubscribe dm constant topics
                parts = self.subscribe_to.split(",")
                if topic not in parts:
                    await self.client.unsubscribe(topic)
            await callback(prep)

    # async def callback_hotword_dialog_ended(self, prep, topic):
        # """ callback after hotword ended message """
        # uid = uuid.uuid4().hex
        # parts = topic.split("/")
        # site = parts[1]
        # self.dialogs[site] = uid
        # await self.client.publish(prep + 'dialog/started', json.dumps({"id":uid}))
        # await self.client.publish(prep + 'asr/start', json.dumps({"id":uid}))
        # await self.client.publish(prep + 'microphone/start', json.dumps({}))

    async def callback_dmcontinue_ttsfinished(self, prep):
        """ callback after hotword continue message """
        await self.client.publish(prep + 'asr/start', json.dumps({}))
        await self.client.publish(prep + 'microphone/start', json.dumps({}))

    async def start_dialog(self, site, text):
        """ start a dialog  """
        prep = 'hermod/' + site + '/'
        uid = uuid.uuid4().hex
        self.dialogs[site] = uid
        if len(text) > 0:
            await self.client.publish(prep + 'dialog/started', json.dumps({"id":uid}))
            await self.client.publish(prep + 'asr/stop', json.dumps({}))
            await self.client.publish(prep + 'hotword/stop', json.dumps({}))
            await self.client.publish(prep + 'microphone/stop', json.dumps({}))
            await self.client.publish(prep + 'nlu/parse', json.dumps({"id":uid, "text": text}))
        # otherwise start dialog and asr
        else:
            await self.client.publish(prep + 'dialog/started', json.dumps({"id":uid}))
            await self.client.publish(prep + 'microphone/start', json.dumps({}))
            await self.client.publish(prep + 'asr/start', json.dumps({"id":uid}))

    def check_dialog_id(self, topic, payload):
        """ check that dialog has an id """
        parts = topic.split("/")
        site = parts[1]
        # only continue processing most recent dialog for this site
        # if id in payload, check it matches the most recent dialog id set in start_dialog()
        is_ok = False
        if payload.get('id', False) and len(payload.get('id')) > 0 and site in self.dialogs:
            if payload.get('id') == self.dialogs[site]:
                is_ok = True
        else:
            is_ok = True
        return is_ok

    def ensure_dialog_id(self, topic, payload):
        """ ensure that dialog has an id """
        uid = None
        parts = topic.split("/")
        site = parts[1]
        # if there is an id, ensure that we have met it before
        if payload.get('id', False):
            if len(payload.get('id')) > 0 and site in self.dialogs \
            and payload.get('id') == self.dialogs[site]:
                uid = payload.get('id')
        # otherwise create one
        if not uid:
            uid = uuid.uuid4().hex
            self.dialogs[site] = uid
        return uid

    async def on_message(self, msg):
        """ handle an mqtt message """
        topic = "{}".format(msg.topic)
        parts = topic.split("/")
        site = parts[1]
        payload_text = msg.payload
        payload = {}
        try:
            payload = json.loads(payload_text)
        except json.JSONDecodeError:
            pass

        prep = 'hermod/' + site + '/'
        # first handle temporary subscription bindings
        await self.handle_waiters(prep, topic)
        # now handle main subscription bindings
        if topic == prep + 'hotword/detected':
            await self.client.publish(prep + 'hotword/stop', json.dumps({
                "id":self.dialogs.get(site, '')
            }))
            uid = uuid.uuid4().hex
            await self.client.publish(prep + 'dialog/started', json.dumps({"id":uid}))
            await self.client.publish(prep + 'asr/start', json.dumps({"id":uid}))
            await self.client.publish(prep + 'microphone/start', json.dumps({"id":uid}))

        elif topic == prep + 'dialog/continue':
            text = payload.get('text', '')
            if text:
                await self.send_and_wait(
                    prep + 'tts/say',
                    # id from last dialog started
                    {"id":payload.get('id', 'no_id')},
                    prep + 'tts/finished',
                    self.callback_dmcontinue_ttsfinished)
            else:
                await self.client.publish(prep + 'asr/start', json.dumps({
                    "id":payload.get("id", "no_id")
                }))
                await self.client.publish(prep + 'microphone/start', json.dumps({}))

        elif topic == prep + 'dialog/start':
            text = payload.get('text', '')
            await self.start_dialog(site, text)

        elif topic == prep + 'asr/text':
            text = payload.get('text', '')
            uid = self.ensure_dialog_id(topic, payload)
            if uid:
                await self.client.publish(prep + 'asr/stop', json.dumps({"id":uid}))
                await self.client.publish(prep + 'microphone/stop', json.dumps({}))
                await self.client.publish(prep + 'nlu/parse', json.dumps({"query": text, "id":uid}))

        elif topic == prep + 'nlu/intent':
            uid = self.ensure_dialog_id(topic, payload)
            if uid:
                payload['id'] = uid
                await self.client.publish(prep + 'intent', json.dumps(payload))

        elif topic == prep + 'dialog/end':
            await self.client.publish(prep + 'dialog/ended', json.dumps({
                "id":payload.get("id", "no_id")
            }))
            await self.client.publish(prep + 'asr/stop', json.dumps({
                "id":payload.get("id", "no_id")
            }))
            await self.client.publish(prep + 'microphone/start', json.dumps({}))
            if site in self.dialogs:
                del self.dialogs[site]
            await self.client.publish(prep + 'hotword/start', json.dumps({}))

        elif topic == prep + 'dialog/init':
            await self.client.publish('hermod/'+site+'/rasa/get_domain', json.dumps({}))
            await self.client.publish('hermod/'+site+'/hotword/activate', json.dumps({}))
            await self.client.publish('hermod/'+site+'/asr/activate', json.dumps({}))
            await self.client.publish('hermod/'+site+'/microphone/start', json.dumps({}))
            await self.client.publish('hermod/'+site+'/hotword/start', json.dumps({}))
