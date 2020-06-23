#!/usr/bin/env python3

"""
Parent class for other mqtt based services implements connection and subscription
"""

import socket
import asyncio
import sys
import time
import uuid
import types
from socket import error as socket_error
#from asyncio_mqtt import Client
from AsyncioMqttClient import Client

class AuthenticatedMqttClient(Client):
    def __init__(self,hostname,port,username='',password=''):
        super(AuthenticatedMqttClient, self).__init__(hostname,port)
        self._client.username_pw_set(username, password)    
        
    # hack to include topic in yielded    
    def _cb_and_generator(self, *, log_context, queue_maxsize=0):
        # Queue to hold the incoming messages
        messages = asyncio.Queue(maxsize=queue_maxsize)
        # Callback for the underlying API
        def _put_in_queue(client, userdata, msg):
            try:
                # convert set to object
                message = types.SimpleNamespace()
                message.topic = msg.topic
                message.payload = msg.payload;
                messages.put_nowait(message)
            except asyncio.QueueFull:
                MQTT_LOGGER.warning(f'[{log_context}] Message queue is full. Discarding message.')
        # The generator that we give to the caller
        async def _message_generator():
            # Forward all messages from the queue
            while True:
                yield await messages.get()
        return _put_in_queue, _message_generator()

class MqttService(object):
    """
    Base Mqtt Service Class
    """
    def __init__(
            self,
            config,
            loop
    ):
        super(MqttService, self).__init__()
        self.loop = loop
        self.subscribe_to = ''
        # self.log('construct ')
        # self.log(self)
  
    async def on_message(self, message):
        self.log('PARENT ONMESSAGE {} {} ', message.topic, message.payload)
        pass

    def log(self, message):
        pass
        print(message)
        sys.stdout.flush()
   
    async def on_connect(self):
        pass

    async def run(self):
        while True:
            async with AuthenticatedMqttClient(self.config.get('mqtt_hostname','localhost'),self.config.get('mqtt_port',1883),self.config.get('mqtt_user',''),self.config.get('mqtt_password','')) as client:
                # self.log('connected')
                self.client = client
                await self.on_connect()
                if hasattr(self,'connect_hook'):
                    await self.connect_hook()
                for sub in self.subscribe_to.split(","):
                    #self.log('subscribe to {}'.format(sub))
                    await client.subscribe(sub)
                
                async with client.unfiltered_messages() as messages:
                    async for message in messages:
                        try:
                            await self.on_message(message)
                        except Exception as e:
                            self.log(e)
                       
            


