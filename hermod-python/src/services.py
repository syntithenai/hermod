"""
This script starts all the service classes from config.yml
Complete configuration is passed through to each service
"""
#https://pythonspot.com/login-to-flask-app-with-google/
import importlib
import subprocess
import time
import os
import pathlib
import urllib
import sys
import yaml
import argparse
import paho.mqtt.client as mqtt
import json
import random
import string
import logging
import asyncio
import os
#from hbmqtt.broker import Broker
from flask import Flask, redirect, url_for, cli, redirect
from flask_dance.contrib.google import make_google_blueprint, google
from subprocess import call, run
import AuthService
import WebService

# threads are used for external processes - mqtt, rasa, rasa action server, web server
from ThreadHandler import ThreadHandler
THREAD_HANDLER = ThreadHandler()

PARSER = argparse.ArgumentParser(description="Stream from microphone to DeepSpeech using VAD")



PARSER.add_argument('-sd', '--speakerdevice', type=str, default='',
					help="Alsa device name for speaker")
                    
PARSER.add_argument('-md', '--microphonedevice', type=str, default='',
					help="Alsa device name for microphone")

PARSER.add_argument('-m', '--mqttserver',action='store_true',
					help="Run MQTT server")
PARSER.add_argument('-mh', '--mqttserver_host',default='',
					help="Run MQTT server")
                 
PARSER.add_argument('-r', '--rasaserver', type=str,
					help="RASA server")
                    
PARSER.add_argument('-w', '--webserver', action='store_true',
					help="Run hermod web server")
                    
PARSER.add_argument('-a', '--actionserver', action='store_true',
					help="Run local rasa_sdk action server")
                    
PARSER.add_argument('-ss', '--skipservices', action='store_true', default=False,
					help="Do not start hermod services")

#cli.load_dotenv(path=os.path.dirname(__file__))

ARGS = PARSER.parse_args()
#print(ARGS) 
print("RUN MODE {} ".format(ARGS.runmode))

F = open(os.path.join(os.path.dirname(__file__), 'config-'+ARGS.runmode+'.yaml'), "r")
CONFIG = yaml.load(F.read(), Loader=yaml.FullLoader)

F = open(os.path.join(os.path.dirname(__file__), 'secrets.yaml'), "r")
secrets = yaml.load(F.read(), Loader=yaml.FullLoader)
if not secrets: secrets = {}

if ARGS.webserver > 0:
    THREAD_HANDLER.run(WebService.start_server,{'config':CONFIG})



# start rasa action server
def start_rasa_action_server(run_event):
    print('START RASA ACTIONS SERVER')
    cmd = ['python','-m','rasa_sdk','--actions','actions','-vv'] 
    p = subprocess.Popen(cmd, stdout=subprocess.PIPE, shell=False, cwd=os.path.join(os.path.dirname(__file__),'../rasa'))
    while run_event.is_set():
        time.sleep(1)
    p.terminate()
    p.wait()
    
if ARGS.actionserver > 0:
    THREAD_HANDLER.run(start_rasa_action_server)

# start rasa  server
def start_rasa_action_server(run_event):
    print('START RASA SERVER')
    cmd = ['rasa','run','--enable-api']  
    # '--debug',,'--model','models'
    p2 = subprocess.Popen(cmd, stdout=subprocess.PIPE, shell=False, cwd=os.path.join(os.path.dirname(__file__),'../rasa'))
    while run_event.is_set():
        time.sleep(1)
    p2.terminate()
    p2.wait()

if ARGS.rasaserver and CONFIG['services'].get('RasaService',False):
    CONFIG['services']['RasaService']['rasa_server'] = ARGS.rasaserver
else:
    THREAD_HANDLER.run(start_rasa_action_server)
    
# use recent version of mosquitto
def start_mqtt_server(run_event):
    print('START MQTT SERVER')
    # /app/mosquitto-1.6.9/src/
    cmd = ['/app/mosquitto-1.6.9/src/mosquitto','-v','-c','/etc/mosquitto/mosquitto.conf'] 
    p = subprocess.Popen(cmd, stdout=subprocess.PIPE, shell=False)
    while run_event.is_set():
        time.sleep(1)
    p.terminate()
    p.wait()

def start_secure_mqtt_server(run_event):
    print('START SECURE MQTT SERVER')
    cmd = ['/app/mosquitto-1.6.9/src/mosquitto','-v','-c','/etc/mosquitto/mosquitto-ssl.conf'] 
    p = subprocess.Popen(cmd, stdout=subprocess.PIPE, shell=False)
    while run_event.is_set():
        time.sleep(1)
    p.terminate()
    p.wait()
            
# send HUP signal to mosquitto when password file is updated    
def start_mqtt_auth_watcher(run_event):
    print('START MQTT   WATCHER')
    cmd = ['/app/src/mosquitto_watcher.sh'] 
    p = subprocess.Popen(cmd, stdout=subprocess.PIPE, shell=True)
    while run_event.is_set():
        time.sleep(1)
    p.terminate()
    p.wait()
		
if ARGS.mqttserver > 0:
    # print(secrets.get('SSL_CERTIFICATES_FOLDER'))
    if secrets.get('SSL_CERTIFICATES_FOLDER'):
        # print(secrets.get('SSL_CERTIFICATES_FOLDER'))
        cmd = ['./update_ssl.sh ' + secrets.get('SSL_CERTIFICATES_FOLDER')]
        p = call(cmd, shell=True)
        THREAD_HANDLER.run(start_secure_mqtt_server)
    else:
        THREAD_HANDLER.run(start_mqtt_server)
    THREAD_HANDLER.run(start_mqtt_auth_watcher)
	
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


def start_hermod(run_event):
    while True and run_event.is_set():
        asyncio.run(async_start_hermod())

async def async_start_hermod():
    # start hermod services as asyncio events in an event loop
    SERVICES = []
    print('START HERMOD SERVICES')
    MODULE_DIR = os.getcwd()
    sys.path.append(MODULE_DIR)
    # override config with args
    if len(ARGS.mqttserver_host) > 0 :
        CONFIG['mqtt_hostname']= ARGS.mqttserver_host
    if len(ARGS.speakerdevice) > 0 and 'AudioService' in CONFIG['services']:
    #		print('have args init {}'.format(ARGS.initialise))
            CONFIG['services']['AudioService']['outputdevice'] = ARGS.speakerdevice
    if len(ARGS.microphonedevice) > 0 and 'AudioService' in CONFIG['services']:
    #		print('have args init {}'.format(ARGS.initialise))
            CONFIG['services']['AudioService']['inputdevice'] = ARGS.microphonedevice
    #print('START SERVER 2')
    # print(CONFIG)
    
    loop = asyncio.get_event_loop()
    # loop.set_debug(True)
    run_services = []
    for service in CONFIG['services']:
        # force dialog initialise if argument present
        full_path = os.path.join(MODULE_DIR, 'src',service + '.py')
        module_name = pathlib.Path(full_path).stem
        module = importlib.import_module(module_name)
        a = getattr(module, service)(CONFIG,loop)
        # print(service)
        # print(a)
        run_services.append(a.run())
        # print('also run')
        
        if hasattr(a,'also_run'):
            # print(a.also_run)
            for i in a.also_run:
                # print(i)
                #print(a.also_run[i])
                run_services.append(i())
        #THREAD_HANDLER.run(target=a.run)
    # print('starting services')
    # print(run_services)
    await asyncio.gather(*run_services)
        
    # print('started services')
    #loop.run_until_complete()
    # print('ended services')
        
if ARGS.runmode and not ARGS.skipservices:
    THREAD_HANDLER.run(start_hermod)
    
# start all threads
THREAD_HANDLER.start_run_loop()

