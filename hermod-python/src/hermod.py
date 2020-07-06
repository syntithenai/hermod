#!/usr/local/bin/python

"""
This script starts all the service classes from config.yml
Complete configuration is passed through to each service
"""
#https://pythonspot.com/login-to-flask-app-with-google/
import signal
import shlex
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
import uvloop
import os
#from hbmqtt.broker import Broker
from flask import Flask, redirect, url_for, cli, redirect
from flask_dance.contrib.google import make_google_blueprint, google
from subprocess import call, run
#import AuthService
# import WebService
from dotenv import load_dotenv
load_dotenv()
from rasa.train import train
from rasa.nlu.convert import convert_training_data
    
# threads are used for external processes - mqtt, rasa, rasa action server, web server
from ThreadHandler import ThreadHandler
THREAD_HANDLER = ThreadHandler()

PARSER = argparse.ArgumentParser(description="Run Hermod voice suite")
# enable uvloop
asyncio.set_event_loop_policy(uvloop.EventLoopPolicy())

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

                    
PARSER.add_argument('-g', '--generate', action='store_true',
					help="Generate Chatito data when training RASA model")
                    
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


# F = open(os.path.join(os.path.dirname(__file__), 'config-all.yaml'), "r")
# CONFIG = yaml.load(F.read(), Loader=yaml.FullLoader)
CONFIG = {'services':{}}
# F = open(os.path.join(os.path.dirname(__file__), 'secrets.yaml'), "r")
# secrets = yaml.load(F.read(), Loader=yaml.FullLoader)
# if not secrets: secrets = {}


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

def train_rasa():
    print('TRAIN RASA')
    
    if ARGS.generate:
        cmd = ['npx chatito --format rasa data/']
        p = call(cmd, shell=True, cwd=os.path.join(os.path.dirname(__file__),'../rasa/chatito'))
        print('CONVERT TO RASA MD')                
        convert_training_data(data_file=os.path.join(os.path.dirname(__file__),'../rasa/chatito/rasa_dataset_training.json'), out_file=os.path.join(os.path.dirname(__file__),'../rasa/chatito/nlu.md'), output_format="md", language="")
        print('DONE CONVERT TO RASA MD') 
    
    if ARGS.train:
        train(
        domain= os.path.join(os.path.dirname(__file__),'../rasa/domain.yml'),
        config= os.path.join(os.path.dirname(__file__),'../rasa/config.yml'),
        training_files= [os.path.join(os.path.dirname(__file__),'../rasa/data/nlu.md'),os.path.join(os.path.dirname(__file__),'../rasa/data/stories.md'),os.path.join(os.path.dirname(__file__),'../rasa/chatito/nlu.md')],
        output= os.path.join(os.path.dirname(__file__),'../rasa/models')
    )
  

    
if not os.environ.get('RASA_ACTIONS_URL'):
    os.environ['RASA_ACTIONS_URL'] = 'http://localhost:5055/webhook'
if not os.environ.get('DUCKLING_URL'):
    os.environ['DUCKLING_URL'] = 'http://localhost:8000'
    
if ARGS.train or ARGS.generate:
    train_rasa()
    
if ARGS.rasaserver:
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


# mqtt service must run before hermod web service to ensure certificates are created 
def generate_certificates():
    print('GEN CERTS')
#if os.environ.get('SSL_CERTIFICATES_FOLDER') and os.path.isfile(os.environ.get('SSL_CERTIFICATES_FOLDER')+'/cert.pem') and os.path.isfile(os.environ.get('SSL_CERTIFICATES_FOLDER')+'/fullchain.pem') and os.path.isfile(os.environ.get('SSL_CERTIFICATES_FOLDER')+'/privkey.pem'):
    domain = os.environ.get('SSL_DOMAIN_NAME','localhost')
    email = os.environ.get('SSL_EMAIL','none@syntithenai.com')
    print(domain)
    cert_path = '/etc/letsencrypt/live/'+domain
    if domain == "localhost":
        print('GEN LOCALHOST SSL KEY')
        p1 = call(['mkdir','-p',cert_path])
        cmd = ['openssl','req','-x509','-newkey','rsa:4096','-keyout',cert_path+'/privkey.pem','-out',cert_path+'/cert.pem','-days','365','-nodes','-subj','/CN=localhost']
        p = call(cmd)
        
    else:
        # files exist so renew
        if os.path.isfile(cert_path+'/cert.pem') and os.path.isfile(cert_path+'/fullchain.pem') and os.path.isfile(cert_path+'/privkey.pem'):
            print('RENEW CERTS')
            cmd = ['certbot','renew'] 
            print(cmd)
            p = call(cmd)
        
        else:
            print('GENERATE CERTS')
            cmd = ['certbot','certonly','-a','standalone','--agree-tos','-d',domain,'-m',email,' --noninteractive'] 
            print(cmd)
            p = call(cmd)
    
    # use mosquitto conf template to rewrite mosquitto conf file including env SSL_CERTIFICATES_FOLDER
    marker_replace_template("/etc/mosquitto/mosquitto-ssl-template.conf","/etc/mosquitto/mosquitto-ssl.conf",'SSL_CERTIFICATE_FOLDER',cert_path)
    
def marker_replace_template(in_file,out_file,old,new):
    f = open(in_file, "r")
    template_content = f.read()
    result_content = template_content.replace(old,new)
    f = open(out_file, "w")
    f.write(result_content)
    f.close()
    
def create_mqtt_user():
    print('PRESET ADMIN PASSWORD TO MOSQ DB')
    cmd = ['/usr/bin/mosquitto_passwd','-b','/etc/mosquitto/password',CONFIG['mqtt_user'],CONFIG['mqtt_password']] 
    p = call(cmd)
    marker_replace_template("/etc/mosquitto/acl-template","/etc/mosquitto/acl",'HERMOD_ROOT_USER',CONFIG['mqtt_user'])
   
       
if ARGS.mqttserver > 0:
    generate_certificates()
    # ensure admin password 
    if os.getenv('MQTT_USER') is not None:
            CONFIG['mqtt_user'] = os.getenv('MQTT_USER')
    if os.getenv('MQTT_PASSWORD') is not None:
            CONFIG['mqtt_password'] = os.getenv('MQTT_PASSWORD')
    create_mqtt_user()
        
    THREAD_HANDLER.run(start_secure_mqtt_server)
    # else:
        # THREAD_HANDLER.run(start_mqtt_server)
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



async def async_start_hermod():
    # start hermod services as asyncio events in an event loop
    SERVICES = []
    print('START HERMOD SERVICES')
    MODULE_DIR = os.getcwd()
    sys.path.append(MODULE_DIR)
    
    if ARGS.webserver :
        webservice_config = {
            'certificates_folder':os.getenv('SSL_CERTIFICATES_FOLDER','/app/certs'),
            'domain_name':os.getenv('SSL_DOMAIN_NAME','localhost'),
            'email':os.getenv('SSL_EMAIL','none@syntithenai.com'),
        }
        
        # TODO dev mode rebuild web - (NEED docker rebuild with npm global watchify)
        # watchify index.js -v -o   static/bundle.js
        # THREAD_HANDLER.run(WebService.start_server,{'config':CONFIG})
        CONFIG['services']['WebService'] = webservice_config

    
    # start rasa action server
    # def start_rasa_action_server(run_event):
        # print('START RASA ACTIONS SERVER')
        # cmd = ['python','-m','rasa_sdk','--actions','actions','-vv'] 
        # p = subprocess.Popen(cmd, stdout=subprocess.PIPE, shell=False, cwd=os.path.join(os.path.dirname(__file__),'../rasa'))
        # while run_event.is_set():
            # time.sleep(1)
        # p.terminate()
        # p.wait()
        
    if ARGS.actionserver > 0:
        # THREAD_HANDLER.run(start_rasa_action_server)
        CONFIG['services']['RasaActionsService'] = {}

        
    if ARGS.hermod :

        # admin mqtt connection
        CONFIG['mqtt_hostname'] = os.getenv('MQTT_HOSTNAME','localhost')
        CONFIG['mqtt_port'] = int(os.getenv('MQTT_PORT',1883))
        CONFIG['mqtt_user'] = os.getenv('MQTT_USER','hermod_admin')
        CONFIG['mqtt_password'] = os.getenv('MQTT_PASSWORD','talk2mebaby')
        # MQTT  host from args
        # if len(ARGS.mqttserver_host) > 0 :
            # CONFIG['mqtt_hostname']= ARGS.mqttserver_host

         # SET SOUND DEVICES
        CONFIG['services']['AudioService'] = {"site":CONFIG.get('mqtt_user'), "inputdevice":"pulse", "outputdevice":"pulse"}
        if os.getenv('SPEAKER_DEVICE') is not None and 'AudioService' in CONFIG['services']:
                CONFIG['services']['AudioService']['outputdevice'] = os.getenv('SPEAKER_DEVICE')
        if os.getenv('MICROPHONE_DEVICE') is not None and 'AudioService' in CONFIG['services']:
                CONFIG['services']['AudioService']['inputdevice'] = os.getenv('MICROPHONE_DEVICE')
        

        CONFIG['services']['DialogManagerService']={}
        CONFIG['services']['DataLoggerService']={}
        
        # HOTWORD
        # #,bumblebee,porcupine"
        CONFIG['services']['PicovoiceHotwordService']={"hotwords":os.getenv('PICOVOICE_HOTWORDS',"picovoice"),  "sensitivity": 0.9}
        
        # ASR 
        # Deepspeech
        using_asr = None
        if os.getenv('DEEPSPEECH_MODELS') is not None and  os.path.exists(os.getenv('DEEPSPEECH_MODELS')):
            if not 'DeepspeechAsrService' in CONFIG['services']:
                CONFIG['services']['DeepspeechAsrService'] = {}
            CONFIG['services']['DeepspeechAsrService']['model_path'] = os.getenv('DEEPSPEECH_MODELS')
            using_asr = 'Deepspeech'
        
        # disable deepspeech and enable IBM ASR
        if os.getenv('IBM_SPEECH_TO_TEXT_APIKEY',None) is not None and len(os.getenv('IBM_SPEECH_TO_TEXT_APIKEY','')) > 0 :
            CONFIG['services'].pop('DeepspeechAsrService',None)
            CONFIG['services']['IbmAsrService'] = {'vad_sensitivity':1 } #'language': os.environ.get('GOOGLE_APPLICATION_LANGUAGE','en-AU')}
            using_asr = 'IBM'
                
        # disable deepspeech,ibm and enable google ASR
        if os.getenv('GOOGLE_ENABLE_ASR',False)=="true" and os.getenv('GOOGLE_APPLICATION_CREDENTIALS',None) is not None and os.path.isfile(os.getenv('GOOGLE_APPLICATION_CREDENTIALS')):
            CONFIG['services'].pop('DeepspeechAsrService',None)
            CONFIG['services'].pop('IbmAsrService',None)
            CONFIG['services']['GoogleAsrService'] = {'language': os.environ.get('GOOGLE_APPLICATION_LANGUAGE','en-AU')}
            using_asr = 'Google'
        print("ASR ENABLED using {}".format(using_asr))
        
        # require asr
        if not using_asr:
            print('ASR CONFIGURATION MISSING')
            exit()
        
        ## TTS
        if os.getenv('GOOGLE_ENABLE_TTS',False)=="true" and os.getenv('GOOGLE_APPLICATION_CREDENTIALS',None) is not None and os.path.isfile(os.getenv('GOOGLE_APPLICATION_CREDENTIALS')):
            print('TTS ENABLED USING GOOGLE')
            CONFIG['services'].pop('Pico2wavTtsService',None)
            CONFIG['services']['GoogleTtsService'] = { 'language': os.environ.get('GOOGLE_APPLICATION_LANGUAGE','en-AU'), 'cache':'/tmp/tts_cache'} #}
        else:
            CONFIG['services'].pop('GoogleTtsService',None)
            CONFIG['services']['Pico2wavTtsService'] = { 'binary_path': os.environ.get('TTS_BINARY','/usr/bin/pico2wave'), 'cache_path':os.environ.get('TTS_CACHE','/tmp/tts_cache')} #}
            print('TTS ENABLED USING PICO2WAV')
        
        if os.getenv('RASA_URL') and len(os.getenv('RASA_URL')) > 0:
            print('RASA ENABLED USING URL '+os.getenv('RASA_URL'))
            rasa_service = CONFIG['services'].get('RasaService',{})
            rasa_service['rasa_server'] = os.getenv('RASA_URL')
            rasa_service['keep_listening'] = os.getenv('HERMOD_KEEP_LISTENING','false')
            #print(rasa_service)`    
            CONFIG['services']['RasaService'] = rasa_service 
        else :
            print('RASA ENABLED USING LOCAL ')
            rasa_service = CONFIG['services'].get('RasaServiceLocal',{})
            rasa_service['rasa_actions_url'] = os.getenv('RASA_ACTIONS_URL','')
            rasa_service['keep_listening'] = os.getenv('HERMOD_KEEP_LISTENING','false')
            #print(rasa_service)`    
            CONFIG['services']['RasaServiceLocal'] = rasa_service 
        # print(CONFIG['services'])
       
        # satellite mode restrict to audio and hotword services
        if ARGS.satellite:
            services = {'AudioService': CONFIG['services']['AudioService'], 'PicovoiceHotwordService':CONFIG['services']['PicovoiceHotwordService']}
            CONFIG['services']= services
        # no local audio/hotword
        if ARGS.nolocalaudio:
            if 'AudioService' in CONFIG['services']: 
                del CONFIG['services']['AudioService']
            if 'PicovoiceHotwordService' in CONFIG['services']: 
                del CONFIG['services']['PicovoiceHotwordService']
        
        # satellite mode
        if ARGS.satellite:
            services = {'AudioService': CONFIG['services']['AudioService'], 'PicovoiceHotwordService':CONFIG['services']['PicovoiceHotwordService']}
            CONFIG['services']= services
        # no local audio/hotword
        if ARGS.nolocalaudio:
            if 'AudioService' in CONFIG['services']: del CONFIG['services']['AudioService']
            if 'PicovoiceHotwordService' in CONFIG['services']: del CONFIG['services']['PicovoiceHotwordService']
            
    # print('START SERVER 2')
    # print(CONFIG)
         
    if True:
        loop = asyncio.get_event_loop()
        # loop.set_debug(True)
        run_services = []
        for service in CONFIG['services']:
            # force dialog initialise if argument present
            full_path = os.path.join(MODULE_DIR, 'src',service + '.py')
            module_name = pathlib.Path(full_path).stem
            module = importlib.import_module(module_name)
            print(module_name)
            a = getattr(module, service)(CONFIG,loop)
            run_services.append(a.run())
            # extra event loop threads on init
            if hasattr(a,'also_run'):
                # print(a.also_run)
                for i in a.also_run:
                    run_services.append(i())
        print('starting services')
        print(run_services)
        await asyncio.gather(*run_services, return_exceptions = True)
        
    # print('started services')
    #loop.run_until_complete()
    # print('ended services')


def start_hermod(run_event):
    #loop = asyncio.get_event_loop()
    loop = asyncio.new_event_loop()
    # asyncio.set_event_loop(loop)
    # loop.set_exception_handler(handle_exception)
    if True and run_event.is_set():
        print('START HERMOD REQUEST ASYNC')
        asyncio.run(async_start_hermod())
        
        # May want to catch other signals too
        # signals = (signal.SIGHUP, signal.SIGTERM, signal.SIGINT)
        # for s in signals:
            # loop.add_signal_handler(
                # s, lambda s=s: asyncio.create_task(shutdown(s, loop)))
        # try:
            # loop.create_task(async_start_hermod())
            # loop.run_forever()
        # finally:
            # loop.close()
            # logging.info("Successfully shutdown the Hermod service.")    
        
# https://www.roguelynn.com/words/asyncio-exception-handling/        
async def shutdown(loop, signal=None):
    print('HERMOD SHUTDOWN')
    """Cleanup tasks tied to the service's shutdown."""
    if signal:
        print(f"Received exit signal {signal.name}...")
    """Cleanup tasks tied to the service's shutdown."""
    print("Closing database connections")
    print("Nacking outstanding messages")
    tasks = [t for t in asyncio.all_tasks() if t is not
             asyncio.current_task()]

    [task.cancel() for task in tasks]

    print(f"Cancelling {len(tasks)} outstanding tasks")
    await asyncio.gather(*tasks)
    print(f"Flushing metrics")
    loop.stop()
    
def handle_exception(loop, context):
    # context["message"] will always be there; but context["exception"] may not
    msg = context.get("exception", context["message"])
    print(f"Caught exception: {msg}")
    print("Shutting down...")
    asyncio.create_task(shutdown(loop))    
        
if ARGS.hermod or ARGS.webserver or ARGS.actionserver :
    THREAD_HANDLER.run(start_hermod)
    
# start all threads
THREAD_HANDLER.start_run_loop()

