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
#import paho.mqtt.client as mqtt
#import MqttAsyncHelper 
from asyncio_mqtt import Client
#import aiomqtt

class AuthenticatedClient(Client):
    def __init__(self,hostname,port,username='',password=''):
        super(AuthenticatedClient, self).__init__(hostname,port)
        # self.username = username
        # self.password = password
        print('set user pass {} {}'.format(username, password) )
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
        
        
    # def on_client_message(self, client, userdata, msg):
        # if not self.got_message:
            # print("Got unexpected message: {}".format(msg.decode()))
        # else:
            # self.log('got message '+msg.topic)
            # self.got_message.set_result([userdata,msg])


    # def on_connect(self, client, userdata, flags, result_code):
        # self.log("Connected with result code {}".format(result_code))
        # self.log(self.__class__.__name__)
        # self.log(self.subscribe_to)
        
        # # SUBSCRIBE
        # for sub in self.subscribe_to.split(","):
            # self.log('subscribe to {}'.format(sub))
            # self.client.subscribe(sub)
    
    # def on_disconnect(self, client, userdata, rc):
        # self.disconnected.set_result(rc)
        
    # def on_disconnect(self, client, userdata, result_code):
        # #self.log("Disconnected with result code " + str(result_code))
        # time.sleep(5)
        # # restart ALL thread targets
        # for threadTarget in self.thread_targets:
            # self.thread_handler.run(target=threadTarget)

    async def on_message(self, message):
        self.log('PARENT ONMESSAGE {} {} ', message.topic, message.payload)
        pass

    def log(self, message):
        print(message)
        sys.stdout.flush()

    

    async def run(self):
        self.log('run')
        self.log(self.__class__.__name__)
        await asyncio.sleep(2)
        self.log('create client')
        
        
        #self.client.username_pw_set(self.config.get('mqtt_user'), self.config.get('mqtt_password'))
        async with AuthenticatedClient(self.config.get('mqtt_hostname','localhost'),self.config.get('mqtt_port',1883),self.config.get('mqtt_user',''),self.config.get('mqtt_password','')) as client:
            self.log('created client')
            self.log(self.config)
            self.client = client
            self.log('created client username')
            if hasattr(self,'connect_hook'):
                await self.connect_hook()
            for sub in self.subscribe_to.split(","):
                self.log('subscribe to {}'.format(sub))
                await client.subscribe(sub)
            self.log('create client subs')
            
            async with client.unfiltered_messages() as messages:
                async for message in messages:
                    # print(type(message))
                    # print(message)
                    await self.on_message(message)
                    #self.message({'topic': message[0],'payload': message[1]})
                    #self.on_message({}, {}, {'topic': message[0],'payload': message[1]})
        
        
        
        
        
        
        # client setup
        # client_id = self.config.get('mqtt_client','hermod')
        # self.client = mqtt.Client(protocol=mqtt.MQTTv311, client_id=client_id)
        # self.client.on_connect = self.on_connect
        # self.client.on_disconnect = self.on_disconnect
        # self.client.on_message = self.on_client_message
        # self.mqtt_hostname = self.config.get('mqtt_hostname')
        # self.mqtt_port = int(self.config.get('mqtt_port'))
        
        # self.disconnected = self.loop.create_future()
        # self.got_message = None
        
        # aioh = MqttAsyncHelper.MqttAsyncHelper(self.loop, self.client)
        # # client connect
        # retry = 0
        # while True:
            # await asyncio.sleep(0.1) 
            # try:
                # self.log("Trying to connect to {} {}".format(self.mqtt_hostname,self.mqtt_port))
                # self.client.username_pw_set(self.config.get('mqtt_user'), self.config.get('mqtt_password'))
                # self.client.connect(self.mqtt_hostname, self.mqtt_port, 60)
                # break
            # except (socket_error, Exception) as e:
                # self.log("MQTT error {}".format(e))
                # time.sleep(5 + int(retry / 5))
                # retry = retry + 1
        # self.log('connected run forevor')        
        # # run forevor
        # while True:
            # #await asyncio.sleep(0.1)
            # await asyncio.sleep(1)
            # print("loop "+self.__class__.__name__)
            # self.got_message = self.loop.create_future()
            # msg = await self.got_message
            # print("Got message with {} bytes".format(len(msg)))
            # # self.on_message(self.client,msg[0],msg[1])
            # self.got_message = None



    # async def main(self):
        # self.disconnected = self.loop.create_future()
        # self.got_message = None

        # self.client = mqtt.Client(client_id=client_id)
        # self.client.on_connect = self.on_connect
        # self.client.on_message = self.on_message
        # self.client.on_disconnect = self.on_disconnect

        # aioh = AsyncioHelper(self.loop, self.client)

        # self.client.connect('mqtt.eclipse.org', 1883, 60)
        # self.client.socket().setsockopt(socket.SOL_SOCKET, socket.SO_SNDBUF, 2048)

        # for c in range(3):
            # await asyncio.sleep(5)
            # print("Publishing")
            # self.got_message = self.loop.create_future()
            # self.client.publish(topic, b'Hello' * 40000, qos=1)
            # msg = await self.got_message
            # print("Got response with {} bytes".format(len(msg)))
            # self.got_message = None

        # self.client.disconnect()
        # print("Disconnected: {}".format(await self.disconnected))
            

        # # start mqtt connection
        # # for threadTarget in self.thread_targets:
            # # # self.log('start thread {} '.format(threadTarget))
            # # self.thread_handler.run(target=threadTarget)
        # # self.thread_handler.start_run_loop()
    
    # def start_mqtt(self, run_event):
        # #self.log("Connecting to {} on port {}".format(self.mqtt_hostname, str(self.mqtt_port)))
        # retry = 0
        # while run_event.is_set(): 
            # try:
                # #self.log("Trying to connect to {} {}".format(self.mqtt_hostname,self.mqtt_port))
                # self.client.username_pw_set(self.config.get('mqtt_user'), self.config.get('mqtt_password'))
                # self.client.connect(self.mqtt_hostname, self.mqtt_port, 60)
                # break
            # except (socket_error, Exception) as e:
                # self.log("MQTT error {}".format(e))
                # time.sleep(5 + int(retry / 5))
                # retry = retry + 1

        # while run_event.is_set():
            # self.client.loop()




# client_id = 'paho-mqtt-python/issue72/' + str(uuid.uuid4())
# topic = client_id
# print("Using client_id / topic: " + client_id)


# class AsyncioHelper:
    # def __init__(self, loop, client):
        # self.loop = loop
        # self.client = client
        # self.client.on_socket_open = self.on_socket_open
        # self.client.on_socket_close = self.on_socket_close
        # self.client.on_socket_register_write = self.on_socket_register_write
        # self.client.on_socket_unregister_write = self.on_socket_unregister_write

    # def on_socket_open(self, client, userdata, sock):
        # print("Socket opened")

        # def cb():
            # print("Socket is readable, calling loop_read")
            # client.loop_read()

        # self.loop.add_reader(sock, cb)
        # self.misc = self.loop.create_task(self.misc_loop())

    # def on_socket_close(self, client, userdata, sock):
        # print("Socket closed")
        # self.loop.remove_reader(sock)
        # self.misc.cancel()

    # def on_socket_register_write(self, client, userdata, sock):
        # print("Watching socket for writability.")

        # def cb():
            # print("Socket is writable, calling loop_write")
            # client.loop_write()

        # self.loop.add_writer(sock, cb)

    # def on_socket_unregister_write(self, client, userdata, sock):
        # print("Stop watching socket for writability.")
        # self.loop.remove_writer(sock)

    # async def misc_loop(self):
        # print("misc_loop started")
        # while self.client.loop_misc() == mqtt.MQTT_ERR_SUCCESS:
            # try:
                # await asyncio.sleep(1)
            # except asyncio.CancelledError:
                # break
        # print("misc_loop finished")


# class AsyncMqttExample:
    # # def __init__(self, loop):
        # # self.loop = loop

    # # def on_connect(self, client, userdata, flags, rc):
        # # print("Subscribing")
        # # client.subscribe(topic)

    # def on_message(self, client, userdata, msg):
        # if not self.got_message:
            # print("Got unexpected message: {}".format(msg.decode()))
        # else:
            # self.got_message.set_result(msg.payload)

    # def on_disconnect(self, client, userdata, rc):
        # self.disconnected.set_result(rc)

    # async def main(self):
        # self.disconnected = self.loop.create_future()
        # self.got_message = None

        # self.client = mqtt.Client(client_id=client_id)
        # self.client.on_connect = self.on_connect
        # self.client.on_message = self.on_message
        # self.client.on_disconnect = self.on_disconnect

        # aioh = AsyncioHelper(self.loop, self.client)

        # self.client.connect('mqtt.eclipse.org', 1883, 60)
        # self.client.socket().setsockopt(socket.SOL_SOCKET, socket.SO_SNDBUF, 2048)

        # for c in range(3):
            # await asyncio.sleep(5)
            # print("Publishing")
            # self.got_message = self.loop.create_future()
            # self.client.publish(topic, b'Hello' * 40000, qos=1)
            # msg = await self.got_message
            # print("Got response with {} bytes".format(len(msg)))
            # self.got_message = None

        # self.client.disconnect()
        # print("Disconnected: {}".format(await self.disconnected))


# print("Starting")
# loop = asyncio.get_event_loop()
# loop.run_until_complete(AsyncMqttExample(loop).main())
# loop.close()
# print("Finished")









