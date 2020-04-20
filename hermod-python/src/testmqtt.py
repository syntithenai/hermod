import logging
import yaml
import os, json
#import mqtt
import paho.mqtt.client as mqtt
#from socket import error as socket_error        
#from typing import Any, Text, Dict, List


#import paho.mqtt.client as mqtt

# # The callback for when the client receives a CONNACK response from the server.
# def on_connect(client, userdata, flags, rc):
    # print("Connected with result code "+str(rc))

    # # Subscribing in on_connect() means that if we lose the connection and
    # # reconnect then subscriptions will be renewed.
    # client.subscribe("$SYS/#")
    # client.subscribe("hermod/#")

# # The callback for when a PUBLISH message is received from the server.
# def on_message(client, userdata, msg):
    # print(msg.topic+" "+str(msg.payload))

client = mqtt.Client()
client.username_pw_set('hermod_server','hermod')
client.connect("localhost", 1883, 60)
client.publish('hermod/hermod_server/display/url',json.dumps({"url":"hereandthere"}))
# client.on_connect = on_connect
# client.on_message = on_message

# Blocking call that processes network traffic, dispatches callbacks and
# handles reconnecting.
# Other loop*() functions are available that give a threaded interface and a
# manual interface.
#client.loop_forever()



#import context  # Ensures paho is in PYTHONPATH
# import paho.mqtt.publish as publish

# publish.single("hermod/hermod_server/display/url", "boo", hostname="localhost")

# F = open(os.path.join(os.path.dirname(__file__), '../src/config-all.yaml'), "r")
# CONFIG = yaml.load(F.read(), Loader=yaml.FullLoader)

# logger = logging.getLogger(__name__)
# client = mqtt.Client(protocol=mqtt.MQTTv311)
# connected = False

# def on_connect(c, userdata, flags, result_code):
    # print('connected ')
    # connected = True
    # publish('hermod/hermod_server/display/url',json.dumps({}))
    # logger.log('published')
# client.on_connect = on_connect

# def connect(CONFIG):
    # print('connecting ')
    # print(CONFIG)
    # while True:
        # try:
            # print("Trying to connect to {} {} {}/{}".format(CONFIG.get('mqtt_hostname'), CONFIG.get('mqtt_port'),CONFIG.get('mqtt_user'), CONFIG.get('mqtt_password')))
            # client.username_pw_set(CONFIG.get('mqtt_user'), CONFIG.get('mqtt_password'))
            # print('set userpass ')
            # client.connect(CONFIG.get('mqtt_hostname'), CONFIG.get('mqtt_port'), 60)
            # break
        # except (socket_error, Exception) as e:
            # print("MQTT error {}".format(e))
    # print('done connect')        

# def publish(topic,message):
    # print('publish '+topic)
    # if connected:
        # print('PUBLISH REAL ')
        # client.publish(topic,message)


# connect(CONFIG)
# client.loop()
