"""
Base Mqtt Service Class
"""
import asyncio
import sys
import types
from AsyncioMqttClient import Client


class AuthenticatedMqttClient(Client):
    """ mqtt client supporting authentication"""
    def __init__(self, hostname, port, username='', password=''):
        """constructor"""
        super(AuthenticatedMqttClient, self).__init__(hostname, port)
        self._client.username_pw_set(username, password)

    # hack to include topic in yielded
    def _cb_and_generator(self, *, log_context, queue_maxsize=0):
        """message callback"""
        # Queue to hold the incoming messages
        messages = asyncio.Queue(maxsize=queue_maxsize)
        # Callback for the underlying API

        def _put_in_queue(client, userdata, msg):
            try:
                # convert set to object
                message = types.SimpleNamespace()
                message.topic = msg.topic
                message.payload = msg.payload
                messages.put_nowait(message)
            except asyncio.QueueFull:
                pass
        # The generator that we give to the caller

        async def _message_generator():
            """generate messages from mqtt connection"""
            # Forward all messages from the queue
            while True:
                yield await messages.get()
        return _put_in_queue, _message_generator()



class MqttService(object):
    """
    Parent class for other mqtt based services implements connection and subscription
    """

    def __init__(
            self,
            config,
            loop
    ):
        """ constructor """
        super(MqttService, self).__init__()
        self.config = config
        self.loop = loop
        self.subscribe_to = ''
        self.client = None
        self.connect_hook
        # self.log('construct ')
        # self.log(self)

    async def on_message(self, message):
        """ abstract handle mqtt message """
        pass

    def log(self, message):
        """ debug logging message """
        print(message)
        sys.stdout.flush()

    async def on_connect(self):
        """ on mqtt connect callback """
        pass

    async def run(self):
        """ connect and stream mqtt messages """
        while True:
            async with AuthenticatedMqttClient(self.config.get('mqtt_hostname', 'localhost'), \
            self.config.get('mqtt_port', 1883), self.config.get('mqtt_user', ''), \
            self.config.get('mqtt_password', '')) as client:
                # self.log('connected')
                self.client = client
                await self.on_connect()
                if hasattr(self, 'connect_hook') and self.connect_hook:
                    await self.connect_hook()
                for sub in self.subscribe_to.split(","):
                    #self.log('subscribe to {}'.format(sub))
                    await client.subscribe(sub)

                async with client.unfiltered_messages() as messages:
                    async for message in messages:
                        try:
                            await self.on_message(message)
                        except Exception as exception:
                            self.log(exception)
