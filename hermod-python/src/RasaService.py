""" RASA Service - HTTP API"""
import json
import aiohttp
import async_timeout
from MqttService import MqttService


class RasaService(MqttService):
    """ Use RASA http api to handle intent and routing messages"""
    def __init__(
            self,
            config,
            loop
    ):
        """constructor"""
        super(
            RasaService,
            self).__init__(config, loop)
        self.config = config
        self.rasa_server = self.config['services']['RasaService'].get(
            'rasa_server', 'http://localhost:5005/')
        self.subscribe_to = 'hermod/+/core/ended,hermod/+/dialog/end,hermod/+/rasa/get_domain' \
        + ',hermod/+/rasa/set_slots,hermod/+/dialog/ended,hermod/+/dialog/init' \
        + ',hermod/+/nlu/externalparse,hermod/+/nlu/parse,hermod/+/intent,hermod/+/intent' \
        + ',hermod/+/dialog/started'

    async def connect_hook(self):
        """mqtt connected callback"""
        for sub in self.subscribe_to.split(","):
            await self.client.subscribe(sub)

    async def set_slots(self, payload, site):
        """set slots in rasa tracker for site"""
        slots = []
        if payload:
            for slot in payload.get('slots', []):
                slots.append({"event": "slot", "name": slot.get(
                    'slot'), "value": slot.get('value')})
            await self.request_post(self.rasa_server + "/conversations/" + site + \
            "/tracker/events", slots)
            await self.send_slots(site)

    async def on_message(self, message):
        """handle mqtt message"""
        topic = "{}".format(message.topic)
        parts = topic.split("/")
        site = parts[1]
        payload_string = str(message.payload, encoding='utf-8')
        payload = {}
        text = ''
        try:
            payload = json.loads(payload_string)
        except json.JSONDecodeError:
            pass

        if topic == 'hermod/' + site + '/rasa/set_slots':
            if payload:
                await self.set_slots(payload, site)

        elif topic == 'hermod/' + site + '/nlu/parse':
            if payload:
                await self.client.publish('hermod/' + site + '/display/startwaiting', \
                json.dumps({}))
                text = payload.get('query')
                await self.nlu_parse_request(site, text, payload)
                await self.client.publish('hermod/' + site + '/display/stopwaiting', json.dumps({}))

        elif topic == 'hermod/' + site + '/nlu/externalparse':
            if payload:
                text = payload.get('query')
                await self.nlu_external_parse_request(site, text, payload)

        elif topic == 'hermod/' + site + '/intent':
            if payload:
                await self.client.publish('hermod/' + site + '/display/startwaiting', \
                json.dumps({}))
                await self.handle_intent(site, payload)
                await self.client.publish('hermod/' + site + '/display/stopwaiting', json.dumps({}))

        elif topic == 'hermod/' + site + '/tts/finished':
            await self.client.unsubscribe('hermod/' + site + '/tts/finished')
            await self.finish(site, payload)

        elif topic == 'hermod/' + site + '/dialog/started':
            await self.reset_tracker(site)

        elif topic == 'hermod/' + site + '/ ':
            # save dialog init data to slots for custom actions
            await self.request_put(self.rasa_server + "/conversations/" + site + \
            "/tracker/events", [{
                "event": "slot",
                "name": "hermod_client",
                "value": json.dumps(payload)
            }])

        elif topic == 'hermod/' + site + '/rasa/get_domain':
            await self.send_domain(site)

        elif topic == 'hermod/' + site + '/core/ended':
            await self.send_story(site, payload)

    async def send_story(self, site, payload):
        """send conversation history for a site"""
        response = await self.request_get_text(self.rasa_server + "/conversations/" + \
        site + "/story", {})
        await self.client.publish('hermod/' + site + '/rasa/story', json.dumps({
            'id': payload.get('id', ''),
            'story': response
        }))

    async def send_domain(self, site):
        """send the currently loaded domain"""
        response = await self.request_get(self.rasa_server + "/domain", \
        {}, {"Accept": "application/json"})
        if response:
            await self.client.publish('hermod/' + site + '/rasa/domain', json.dumps(response))

    async def reset_tracker(self, site):
        """reset the tracker for this site"""
        self.log('RESSET tracker ' + site)
        #pass
        # backup slots
        # response = await self.request_get(self.rasa_server+"/conversations/"+site+"/tracker",{})
        # #self.log('TRAKER BEFORE')
        # #self.log(response.get('slots',''))

        # # reset tracker
        # # await self.request_put(self.rasa_server+"/conversations/"+site+"/tracker/events",[])
        # # #self.log('RESSET tracker '+site)
        # await
        # self.request_post(self.rasa_server+"/conversations/"+site+"/tracker/events",[{"event":
        # "restart"}])

        # # restore slots ?? this should work with event
        # slotsets = []
        # slots = response.get('slots',[])
        # for slot in slots:
        # if slots[slot]:
        # slotsets.append({"event": "slot", "name": slot, "value": slots[slot]})
        # #self.log('RESTORE SLOTS')
        # #self.log(slotsets)
        # await
        # self.request_put(self.rasa_server+"/conversations/"+site+"/tracker/events",slotsets)

        # # check and debug
        # response = await self.request_get(self.rasa_server+"/conversations/"+site+"/tracker",{})
        # #self.log('TRAKER after')
        # #self.log(response.get('slots',''))

        #requests.post(self.rasa_server+"/conversations/"+site+"/tracker/events",
        #json.dumps({"event": "restart"}))
        # #requests.put(self.rasa_server+"/conversations/"+site+"/tracker/events",
        #json.dumps([]),headers = {'content-type': 'application/json'})

    async def handle_intent(self, site, payload):
        """handle intent message"""
        await self.client.publish('hermod/' + site + '/core/started', json.dumps(payload))
        response = await self.request_post(self.rasa_server + "/conversations/" + site + \
        "/trigger_intent", {
            "name": payload.get('intent').get('name'),
            "entities": payload.get('entities')
        })
        messages = response.get('messages')
        if messages:
            message = '. '.join(map(lambda x: x.get('text', ''), messages))
            await self.client.subscribe('hermod/' + site + '/tts/finished')
            await self.client.publish('hermod/' + site + '/tts/say', json.dumps({
                "text": message,
                "id": payload.get('id', '')
            }))
        else:
            await self.finish(site, payload)

    async def send_slots(self, site):
        """send mqtt message with current slots"""
        response = await self.request_get(self.rasa_server + "/conversations/" + site + \
        "/tracker", {})
        slots = response.get('slots', [])
        await self.client.publish('hermod/' + site + '/dialog/slots', json.dumps(slots))

    async def finish(self, site, payload):
        """ handle intent complete callback """
        response = await self.request_get(self.rasa_server + "/conversations/" + site + \
        "/tracker", {})
        # events = response.get('events', [])
        slots = response.get('slots', [])
        if slots.get('hermod_force_continue', False) == 'true':
            await self.request_post(self.rasa_server + "/conversations/" + site + \
            "/tracker/events", [{"event": "slot", "name": 'hermod_force_continue', "value": ''}, \
            {"event": "slot", "name": 'hermod_force_end', "value": ''}])
            await self.client.publish('hermod/' + site + '/dialog/continue', json.dumps({
                "id": payload.get("id", "")
            }))
        elif slots.get('hermod_force_end', False) == 'true':
            await self.request_post(self.rasa_server + "/conversations/" + site + \
            "/tracker/events", [{
                "event": "slot",
                "name": 'hermod_force_continue',
                "value": ''
            }, {"event": "slot", "name": 'hermod_force_end', "value": ''}])
            await self.client.publish('hermod/' + site + '/dialog/end', \
            json.dumps({"id": payload.get("id", "")}))
        else:
            if self.config.get('keep_listening') == "true":
                await self.client.publish('hermod/' + site + \
                '/dialog/continue', json.dumps({"id": payload.get("id", "")}))
            else:
                await self.client.publish('hermod/' + site + \
                '/dialog/end', json.dumps({"id": payload.get("id", "")}))
        await self.send_slots(site)
        await self.client.publish('hermod/' + site + '/core/ended', json.dumps(payload))

    async def nlu_parse_request(self, site, text, payload):
        """parse text into NLU json and send as message"""
        response = await self.request_post(self.rasa_server + \
        "/model/parse", {"text": text, "message_id": site})
        if payload and 'id' in payload:
            response['id'] = payload.get('id', '')
        await self.client.publish('hermod/' + site + '/nlu/intent', json.dumps(response))

    async def nlu_external_parse_request(self, site, text, payload):
        """parse text into NLU json and send as message without triggering the hermod flow"""
        response = await self.request_post(self.rasa_server + \
        "/model/parse", {"text": text, "message_id": site})
        if payload and 'id' in payload:
            response['id'] = payload.get('id', '')
        await self.client.publish('hermod/' + site + '/nlu/externalintent', json.dumps(response))

    async def request_get(self, url, json_data, extra_headers=None):
        """send http get request"""
        if not extra_headers:
            extra_headers = {}
        extra_headers['content-type'] = 'application/json'
        with async_timeout.timeout(10):
            async with aiohttp.ClientSession() as session:
                async with session.get(url, json=json_data, headers=extra_headers) as resp:
                    return await resp.json()

    async def request_get_text(self, url, json_data, extra_headers=None):
        """send http get text request"""
        if not extra_headers:
            extra_headers = {}
        with async_timeout.timeout(10):
            async with aiohttp.ClientSession() as session:
                async with session.get(url, json=json_data, headers=extra_headers) as resp:
                    return await resp.text()

    async def request_post(self, url, json_data):
        """send http post request"""
        with async_timeout.timeout(25):
            async with aiohttp.ClientSession() as session:
                async with session.post(url, json=json_data, \
                headers={'content-type': 'application/json'}) as resp:
                    return await resp.json()

    async def request_put(self, url, json_data):
        """send http put request"""
        with async_timeout.timeout(10):
            async with aiohttp.ClientSession() as session:
                async with session.put(url, json=json_data, \
                headers={'content-type': 'application/json'}) as resp:
                    return await resp.json()
