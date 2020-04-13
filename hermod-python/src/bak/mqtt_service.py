"""
Parent class for other mqtt based services implements connection and subscription
"""

import sys
import time
from socket import error as socket_error
import paho.mqtt.client as mqtt


from thread_handler import ThreadHandler


class MqttService(object):
    """
    Base Mqtt Service Class
    """
    def __init__(
            self,
            config
    ):

        super(MqttService, self).__init__()
        self.thread_handler = ThreadHandler()
    #    if config.get('mqtt_protocol') == "311":
        self.client = mqtt.Client(protocol=mqtt.MQTTv311)
     #   else:
      #      self.client = mqtt.Client()

        self.client.on_connect = self.on_connect
        self.client.on_disconnect = self.on_disconnect
        self.client.on_message = self.on_message
        self.mqtt_hostname = config.get('mqtt_hostname')
        self.mqtt_port = int(config.get('mqtt_port'))
        self.thread_targets = [self.start_mqtt]
        self.subscribe_to = 'hermod/DISABLED'
        #self.site = site

    def start_mqtt(self, run_event):
        #self.log("Connecting to {} on port {}".format(self.mqtt_hostname, str(self.mqtt_port)))
        retry = 0
        while run_event.is_set(): 
            try:
                #self.log("Trying to connect to {} {}".format(self.mqtt_hostname,self.mqtt_port))
                self.client.username_pw_set(self.config.get('mqtt_user'), self.config.get('mqtt_password'))
                self.client.connect(self.mqtt_hostname, self.mqtt_port, 60)
                break
            except (socket_error, Exception) as e:
                self.log("MQTT error {}".format(e))
                time.sleep(5 + int(retry / 5))
                retry = retry + 1

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
        # restart ALL thread targets
        for threadTarget in self.thread_targets:
            self.thread_handler.run(target=threadTarget)

    def on_message(self, client, userdata, msg):
        self.log('PARENT ONMESSAGE {} ', msg.topic)
        pass

    def log(self, message):
        print(message)
        sys.stdout.flush()

    # child classes can override/extend this.thread_targets for additional
    # threads at run or at any time call self.thread_handler.run(target,args)

    def run(self, run_event):
        # start mqtt connection
        for threadTarget in self.thread_targets:
            # self.log('start thread {} '.format(threadTarget))
            self.thread_handler.run(target=threadTarget)
        self.thread_handler.start_run_loop()
