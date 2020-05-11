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
from dotenv import load_dotenv
load_dotenv()

# threads are used for external processes - mqtt, rasa, rasa action server, web server
from ThreadHandler import ThreadHandler
THREAD_HANDLER = ThreadHandler()

PARSER = argparse.ArgumentParser(description="Run Hermod voice suite")



# PARSER.add_argument('-sd', '--speakerdevice', type=str, default='',
					# help="Alsa device name for speaker")
                    
# PARSER.add_argument('-md', '--microphonedevice', type=str, default='',
					# help="Alsa device name for microphone")

PARSER.add_argument('-m', '--mqttserver',action='store_true',
					help="Run MQTT server")
                    
                 
PARSER.add_argument('-r', '--rasaserver', action='store_true',
					help="Run RASA server")
                    
PARSER.add_argument('-t', '--train', action='store_true',
					help="Train RASA models when starting local RASA server")
                    
PARSER.add_argument('-w', '--webserver', action='store_true',
					help="Run hermod web server")
                    
PARSER.add_argument('-a', '--actionserver', action='store_true',
					help="Run local rasa_sdk action server")
                    
PARSER.add_argument('-d', '--hermod', action='store_true', default=False,
					help="Start hermod services")
                    
PARSER.add_argument('-sm', '--satellite', action='store_true', default=False,
					help="Only start hermod local audio and hotword services")                   

PARSER.add_argument('-nl', '--nolocalaudio', action='store_true', default=False,
					help="Dont start hermod local audio or hotword service")                     

#cli.load_dotenv(path=os.path.dirname(__file__))

ARGS = PARSER.parse_args()
#print(ARGS) 


F = open(os.path.join(os.path.dirname(__file__), 'config-all.yaml'), "r")
CONFIG = yaml.load(F.read(), Loader=yaml.FullLoader)

# F = open(os.path.join(os.path.dirname(__file__), 'secrets.yaml'), "r")
# secrets = yaml.load(F.read(), Loader=yaml.FullLoader)
# if not secrets: secrets = {}

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
def start_rasa_server(run_event):
    print('START RASA SERVER')
    if os.getenv('RASA_ACTIONS_URL') and len(os.getenv('RASA_ACTIONS_URL')) > 0:
        # ensure rasa endpoints file matches RASA_ACTIONS_URL env var
        endpoints_file = open(os.path.join(os.path.dirname(__file__), '../rasa/endpoints.yml'), "r")
        endpoints = yaml.load(endpoints_file.read(), Loader=yaml.FullLoader)
        print('ENDPOINTS')
        print(endpoints)
        endpoints['action_endpoint']={"url":os.getenv('RASA_ACTIONS_URL')}
        # write updates
        with open(os.path.join(os.path.dirname(__file__), '../rasa/endpoints.yml'),'w') as outfile:
            yaml.dump(endpoints,outfile, default_flow_style = False)
        print('ENDPOINTS WRITTEN')
        
    cmd = ['rasa','run','--enable-api']  
    # '--debug',,'--model','models'
    # p2 = subprocess.Popen(cmd, stdout=subprocess.PIPE, shell=True, cwd=os.path.join(os.path.dirname(__file__),'../rasa'), env={'RASA_ACTIONS_URL':os.getenv('RASA_ACTIONS_URL')})
    
    p2 = subprocess.Popen(cmd, stdout=subprocess.PIPE, shell=False, cwd=os.path.join(os.path.dirname(__file__),'../rasa'))
    while run_event.is_set():
        time.sleep(1)
    p2.terminate()
    p2.wait()

def train_rasa(run_event):
    cmd = ['rasa','train',' --data','data/nlu.md','data/stories.md','chatito/nlu.md']  
    # '--debug',,'--model','models'
    p1 = subprocess.Popen(cmd, stdout=subprocess.PIPE, shell=False, cwd=os.path.join(os.path.dirname(__file__),'../rasa'))
    while run_event.is_set():
        time.sleep(1)
    p1.terminate()
    p1.wait()
    
if not os.environ.get('RASA_ACTIONS_URL'):
    os.environ['RASA_ACTIONS_URL'] = 'http://localhost:5055/webhook'
if not os.environ.get('DUCKLING_URL'):
    os.environ['DUCKLING_URL'] = 'http://localhost:8000'
    
if ARGS.train:
    THREAD_HANDLER.run(train_rasa)    
    
if ARGS.rasaserver and CONFIG['services'].get('RasaService',False):
    THREAD_HANDLER.run(start_rasa_server)
    
# use recent version of mosquitto
def start_mqtt_server(run_event):
    print('START MQTT SERVER')
    # /app/mosquitto-1.6.9/src/
    cmd = ['mosquitto','-v','-c','/etc/mosquitto/mosquitto.conf'] 
    p = subprocess.Popen(cmd, stdout=subprocess.PIPE, shell=False)
    while run_event.is_set():
        time.sleep(1)
    p.terminate()
    p.wait()

def start_secure_mqtt_server(run_event):
    print('START SECURE MQTT SERVER')
    cmd = ['mosquitto','-v','-c','/etc/mosquitto/mosquitto-ssl.conf'] 
    p = subprocess.Popen(cmd, stdout=subprocess.PIPE, shell=False)
    while run_event.is_set():
        time.sleep(1)
    p.terminate()
    p.wait()
            
# send HUP signal to mosquitto when password file is updated    
def start_mqtt_auth_watcher(run_event):
    print('START MQTT   WATCHER')
    #os.path.join(os.path.dirname(__file__),
    cmd = ['/app/src/mosquitto_watcher.sh']
    p = subprocess.Popen(cmd, stdout=subprocess.PIPE, shell=True) # , cwd=os.path.join(os.path.dirname(__file__))
    while run_event.is_set():
        time.sleep(1)
    p.terminate()
    p.wait()

        
if ARGS.mqttserver > 0:
    if os.environ.get('SSL_CERTIFICATES_FOLDER') and os.path.isfile(os.environ.get('SSL_CERTIFICATES_FOLDER')+'/cert.pem') and os.path.isfile(os.environ.get('SSL_CERTIFICATES_FOLDER')+'/fullchain.pem') and os.path.isfile(os.environ.get('SSL_CERTIFICATES_FOLDER')+'/privkey.pem'):
        # use mosquitto conf template to rewrite mosquitto conf file including env SSL_CERTIFICATES_FOLDER
        cmd = ['/app/src/update_ssl.sh' + ' ' + os.environ.get('SSL_CERTIFICATES_FOLDER')]
        p = call(cmd, shell=True, cwd=os.path.join(os.path.dirname(__file__)))
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
    
    # OVERRIDE CONFIG
    # admin mqtt connection
    if os.getenv('MQTT_HOSTNAME') is not None:
        CONFIG['mqtt_hostname'] = os.getenv('MQTT_HOSTNAME')
    # MQTT  host from args
    # if len(ARGS.mqttserver_host) > 0 :
        # CONFIG['mqtt_hostname']= ARGS.mqttserver_host

    if os.getenv('MQTT_PORT') is not None:
            CONFIG['mqtt_port'] = os.getenv('MQTT_PORT')
    if os.getenv('MQTT_USER') is not None:
            CONFIG['mqtt_user'] = os.getenv('MQTT_USER')
    if os.getenv('MQTT_PASSWORD') is not None:
            CONFIG['mqtt_password'] = os.getenv('MQTT_PASSWORD')
    
    if os.getenv('DEEPSPEECH_MODELS') is not None and 'DeepSpeechAsrService' in CONFIG['services']:
        CONFIG['services']['DeepSpeechAsrService']['model_path'] = os.getenv('DEEPSPEECH_MODELS')
    

    # disable deepspeech and enable IBM ASR
    
    if os.getenv('IBM_SPEECH_TO_TEXT_APIKEY',None) is not None:
            print('EENABLE ibm ASR')
            #del CONFIG['services']['DeepspeechAsrService']
            CONFIG['services'].pop('DeepspeechAsrService',None)
            CONFIG['services']['IbmAsrService'] = {'vad_sensitivity':1 } #'language': os.environ.get('GOOGLE_APPLICATION_LANGUAGE','en-AU')}
            print(CONFIG['services'])
            
            
    # disable deepspeech and enable google ASR
    if os.getenv('GOOGLE_APPLICATION_CREDENTIALS',None) is not None and os.path.isfile(os.getenv('GOOGLE_APPLICATION_CREDENTIALS')):
            print('EENABLE GOOGLE ASR')
            CONFIG['services'].pop('DeepspeechAsrService',None)
            #del CONFIG['services']['DeepspeechAsrService']
            #print(CONFIG)
            CONFIG['services']['GoogleAsrService'] = {'language': os.environ.get('GOOGLE_APPLICATION_LANGUAGE','en-AU')}
    
    if os.getenv('RASA_URL') and len(os.getenv('RASA_URL')) > 0:
        CONFIG['services']['RasaService']['rasa_server'] = os.getenv('RASA_URL')
        
    # SET SOUND DEVICES FROM ENVIRONMENT VARS
    if os.getenv('SPEAKER_DEVICE') is not None and 'AudioService' in CONFIG['services']:
            CONFIG['services']['AudioService']['outputdevice'] = os.getenv('SPEAKER_DEVICE')
    if os.getenv('MICROPHONE_DEVICE') is not None and 'AudioService' in CONFIG['services']:
            CONFIG['services']['AudioService']['inputdevice'] = os.getenv('MICROPHONE_DEVICE')
    print('audio override')
    print(CONFIG['services']['AudioService'])
    # # OVERRIDE SOUND DEVICES FROM  CLI ARGS
    # if len(ARGS.speakerdevice) > 0 and 'AudioService' in CONFIG['services']:
            # CONFIG['services']['AudioService']['outputdevice'] = ARGS.speakerdevice
    # if len(ARGS.microphonedevice) > 0 and 'AudioService' in CONFIG['services']:
            # CONFIG['services']['AudioService']['inputdevice'] = ARGS.microphonedevice
    
    # satellite mode
    if ARGS.satellite:
        services = {'AudioService': CONFIG['services']['AudioService'], 'PicovoiceHotwordService':CONFIG['services']['PicovoiceHotwordService']}
        CONFIG['services']= services
    # no local audio/hotword
    if ARGS.nolocalaudio:
        if 'AudioService' in CONFIG['services']: del CONFIG['services']['AudioService']
        if 'PicovoiceHotwordService' in CONFIG['services']: del CONFIG['services']['PicovoiceHotwordService']
        
    print('START SERVER 2')
    print(CONFIG)
    
    loop = asyncio.get_event_loop()
    # loop.set_debug(True)
    run_services = []
    for service in CONFIG['services']:
        # force dialog initialise if argument present
        full_path = os.path.join(MODULE_DIR, 'src',service + '.py')
        module_name = pathlib.Path(full_path).stem
        module = importlib.import_module(module_name)
        a = getattr(module, service)(CONFIG,loop)
        run_services.append(a.run())
        # extra event loop threads on init
        if hasattr(a,'also_run'):
            # print(a.also_run)
            for i in a.also_run:
                run_services.append(i())
    print('starting services')
    print(run_services)
    await asyncio.gather(*run_services)
        
    # print('started services')
    #loop.run_until_complete()
    # print('ended services')
        
if ARGS.hermod:
    THREAD_HANDLER.run(start_hermod)
    
# start all threads
THREAD_HANDLER.start_run_loop()

