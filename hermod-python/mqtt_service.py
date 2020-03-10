import os
import struct
import sys
from datetime import datetime
from threading import Thread
import json
import time
import io
from socket import error as socket_error
import paho.mqtt.client as mqtt


from thread_handler import ThreadHandler


class MqttService(object):
   
    def __init__(
            self,
            mqtt_hostname='localhost',
            mqtt_port=1883 ,
            site = 'default'
            ):

        super(MqttService, self).__init__()
        # print('MQTT CONSTRUCTOR {} {} {}'.format(mqtt_hostname,mqtt_port,site))
        self.thread_handler = ThreadHandler()
        self.client = mqtt.Client()
        self.client.on_connect = self.on_connect
        self.client.on_disconnect = self.on_disconnect
        self.client.on_message = self.on_message
        self.mqtt_hostname = mqtt_hostname
        self.mqtt_port = int(mqtt_port)
        self.thread_targets=[self.startMqtt ]
        self.subscribe_to = 'hermod/{}/DISABLED/#'.format(site)  
        self.site = site  
            
    def startMqtt(self, run_event):
        #self.log("Connecting to {} on port {}".format(self.mqtt_hostname, str(self.mqtt_port)))
        retry = 0
        while run_event.is_set():
            try:
              # self.log("Trying to connect to {} {}".format(self.mqtt_hostname,self.mqtt_port))
                self.client.connect(self.mqtt_hostname, self.mqtt_port, 60)
                break
            except (socket_error, Exception) as e:
                self.log("MQTT error {}".format(e))
                time.sleep(5 + int(retry / 5))
                retry = retry + 1
            # SUBSCRIBE 
            # for sub in self.subscribe_to.split(","):
                # self.log('sub to '+sub)
                # self.client.subscribe(sub)
                
        while run_event.is_set():
            self.client.loop()
            
      

    def on_connect(self, client, userdata, flags, result_code):
       # self.log("Connected with result code {}".format(result_code))
        # SUBSCRIBE 
        for sub in self.subscribe_to.split(","):
           # self.log('subscribe to {}'.format(sub))
           self.client.subscribe(sub)


    def on_disconnect(self, client, userdata, result_code):
        #self.log("Disconnected with result code " + str(result_code))
        time.sleep(5)
        for threadTarget in self.thread_targets:
            self.thread_handler.run(target=threadTarget)

    def on_message(self, client, userdata, msg):
        self.log('PARENT ONMESSAGE {} ',msg.topic)
        pass
                
        
    def log(self, message):
        print(message);
        sys.stdout.flush()
        

    def run(self,run_event):
        # start mqtt connection
        for threadTarget in self.thread_targets:
            # self.log('start thread {} '.format(threadTarget))
            
            self.thread_handler.run(target=threadTarget)
        self.thread_handler.start_run_loop()

    
