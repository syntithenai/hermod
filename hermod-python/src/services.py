"""
This script starts all the service classes from config.yml
Complete configuration is passed through to each service
"""

import importlib
import subprocess
import time
import os
import pathlib
import sys
import yaml
import argparse
import paho.mqtt.client as mqtt


import logging
import asyncio
import os
from hbmqtt.broker import Broker

from thread_handler import ThreadHandler
THREAD_HANDLER = ThreadHandler()

PARSER = argparse.ArgumentParser(description="Stream from microphone to DeepSpeech using VAD")

PARSER.add_argument('-r', '--run', type=str, default='all',
					help="Run mode - all|server|client")

PARSER.add_argument('-i', '--initialise', type=str, default='',
					help="Send init messages to listed sites to start microphone and hotword. Eg home,default,client1")

PARSER.add_argument('-m', '--mqttserver', action='store_true',
					help="Run local mqtt server")


ARGS = PARSER.parse_args()
print(ARGS)
print("RUN MODE {} {}".format(ARGS.run,ARGS.initialise))

F = open(os.path.join(os.path.dirname(__file__), 'config-'+ARGS.run+'.yaml'), "r")
CONFIG = yaml.load(F.read(), Loader=yaml.FullLoader)


if ARGS.mqttserver:
	# use mosquitto
	def start_mqtt_server(run_event):
		print('START MQTT SERVER')
		cmd = ['/usr/sbin/mosquitto','-d'] 
		p = subprocess.Popen(cmd, stdout=subprocess.PIPE, shell=False)
		while run_event.is_set():
			time.sleep(0.5)
		#print('STOP MQTT SERVER')
		
		p.terminate()
		p.wait()
		# -c /etc/mosquitto.conf')
	THREAD_HANDLER.run(start_mqtt_server)
	
	# # use hbmqtt
	# config = {
		# 'listeners': {
			# 'default': {
				# 'type': 'tcp',
				# 'bind': '0.0.0.0:1883',
			# },
			# 'ws-mqtt': {
				# 'bind': '127.0.0.1:8080',
				# 'type': 'ws',
				# 'max_connections': 30,
			# },
		# },
		# 'sys_interval': 10,
		# 'auth': {
			# 'allow-anonymous': True,
			# #'password-file': os.path.join(os.path.dirname(os.path.realpath(__file__)), "passwd"),
			# 'plugins': [
				# 'auth_file', 'auth_anonymous'
			# ]
		# },
		# 'topic-check': {
			# 'enabled': False
		# }
	# }	
	
	# @asyncio.coroutine
	# def broker_coro():
		# broker = Broker(config)
		# yield from broker.start()

	# def start_mqtt_server(run_event):
		# print('START MQTT SERVER')
		# #asyncio.new_event_loop()
		# ioloop = asyncio.new_event_loop()
		# ioloop.run_until_complete(broker_coro())
		# ioloop.run_forever()
		
	# THREAD_HANDLER.run(start_mqtt_server)

if ARGS.run:
	SERVICES = []
	print('START SERVER')
	MODULE_DIR = os.getcwd()
	sys.path.append(MODULE_DIR)
	if len(ARGS.initialise) > 0 and 'DialogManagerService' in CONFIG['services']:
	#		print('have args init {}'.format(ARGS.initialise))
			CONFIG['services']['DialogManagerService'] = {'initialise' : ARGS.initialise}
	#print('START SERVER 2')
	print(CONFIG)
	for service in CONFIG['services']:
		# force dialog initialise if argument present
		full_path = os.path.join(MODULE_DIR, 'src',service + '.py')
		print('START SERVER 3')
		print(full_path)
		module_name = pathlib.Path(full_path).stem
		module = importlib.import_module(module_name)
		a = getattr(module, service)(CONFIG)
		THREAD_HANDLER.run(target=a.run)

	print('started services')
	THREAD_HANDLER.start_run_loop()
