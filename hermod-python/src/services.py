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
from subprocess import call


from thread_handler import ThreadHandler
THREAD_HANDLER = ThreadHandler()

PARSER = argparse.ArgumentParser(description="Stream from microphone to DeepSpeech using VAD")

PARSER.add_argument('-rm', '--runmode', type=str, default='all',
					help="Run mode - all|server|client")

PARSER.add_argument('-sd', '--speakerdevice', type=str, default='',
					help="Alsa device name for speaker")
                    
PARSER.add_argument('-md', '--microphonedevice', type=str, default='',
					help="Alsa device name for microphone")

PARSER.add_argument('-m', '--mqttserver',action='store_true',
					help="Run MQTT server")
                    
PARSER.add_argument('-r', '--rasaserver', action='store_true',
					help="Run RASA server")
                    
PARSER.add_argument('-z', '--authorizationserver', action='store_true',
					help="Run RASA auth server")
                    
PARSER.add_argument('-a', '--actionserver', action='store_true',
					help="Run local rasa_sdk action server")
                    
PARSER.add_argument('-ss', '--skipservices', action='store_true', default=False,
					help="Do not start hermod services")


ARGS = PARSER.parse_args()
#print(ARGS)
print("RUN MODE {} ".format(ARGS.runmode))

F = open(os.path.join(os.path.dirname(__file__), 'config-'+ARGS.runmode+'.yaml'), "r")
CONFIG = yaml.load(F.read(), Loader=yaml.FullLoader)

def get_password(stringLength=10):
    """Generate a random string of fixed length """
    letters = string.ascii_lowercase
    return ''.join(random.choice(letters) for i in range(stringLength))

# mosquitto_passwd -b passwordfile username password
def get_mosquitto_user(email):
    email_clean = email.replace("@","__")
    print('START RASA ACTIONS SERVER')
    password = get_password()
    cmd = ['mosquitto_passwd','-b','/etc/mosquitto/password',email_clean,password] 
    p = call(cmd)
    return {"email":email,"email_clean":email_clean,"password":password}


# start login server
cli.load_dotenv(path=os.path.dirname(__file__))
app = Flask(__name__)
print(os.environ.get("GOOGLE_OAUTH_CLIENT_ID"))
app.secret_key = os.environ.get("FLASK_SECRET_KEY", "supersekrithermod")
app.config["GOOGLE_OAUTH_CLIENT_ID"] = os.environ.get("GOOGLE_OAUTH_CLIENT_ID")
app.config["GOOGLE_OAUTH_CLIENT_SECRET"] = os.environ.get("GOOGLE_OAUTH_CLIENT_SECRET")
google_bp = make_google_blueprint(scope=["profile", "email"])
app.register_blueprint(google_bp, url_prefix="/login")

@app.route("/")
def index():
    if not google.authorized:
        return redirect(url_for("google.login"))
    resp = google.get("/oauth2/v1/userinfo")
    assert resp.ok, resp.text
    return json.dumps(get_mosquitto_user(resp.json()["email"]))
    # return redirect('http://localhost/'+urllib.urlencode(get_mosquitto_user(resp.json()["email"])))
    #return "You are {email} on Google".format(email=resp.json()["email"])

def start_rasa_auth_server(run_event):
    print('START AUTH SERVER')
    app.run(host='0.0.0.0')
    
   
if ARGS.authorizationserver > 0:
    THREAD_HANDLER.run(start_rasa_auth_server)



# start rasa action server
def start_rasa_action_server(run_event):
    print('START RASA ACTIONS SERVER')
    cmd = ['python','-m','rasa_sdk','--actions','actions','-vv'] 
    p = subprocess.Popen(cmd, stdout=subprocess.PIPE, shell=False, cwd=os.path.join(os.path.dirname(__file__),'../rasa'))
    while run_event.is_set():
        time.sleep(0.5)
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
        time.sleep(0.1)
    p2.terminate()
    p2.wait()

if ARGS.rasaserver > 0:
    THREAD_HANDLER.run(start_rasa_action_server)

if ARGS.mqttserver:
	# use mosquitto
	def start_mqtt_server(run_event):
		print('START MQTT SERVER')
		cmd = ['/usr/sbin/mosquitto','-d'] 
		p = subprocess.Popen(cmd, stdout=subprocess.PIPE, shell=False)
		while run_event.is_set():
			time.sleep(0.5)
		p.terminate()
		p.wait()
		
if ARGS.mqttserver > 0:
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

if ARGS.runmode and not ARGS.skipservices:
	SERVICES = []
	print('START SERVER')
	MODULE_DIR = os.getcwd()
	sys.path.append(MODULE_DIR)
	
	if len(ARGS.speakerdevice) > 0 and 'AudioService' in CONFIG['services']:
	#		print('have args init {}'.format(ARGS.initialise))
			CONFIG['services']['AudioService']['outputdevice'] = ARGS.speakerdevice
	if len(ARGS.microphonedevice) > 0 and 'AudioService' in CONFIG['services']:
	#		print('have args init {}'.format(ARGS.initialise))
			CONFIG['services']['AudioService']['inputdevice'] = ARGS.microphonedevice
	#print('START SERVER 2')
	print(CONFIG)
	for service in CONFIG['services']:
		# force dialog initialise if argument present
		full_path = os.path.join(MODULE_DIR, 'src',service + '.py')
		module_name = pathlib.Path(full_path).stem
		module = importlib.import_module(module_name)
		a = getattr(module, service)(CONFIG)
		THREAD_HANDLER.run(target=a.run)

	print('started services')
	THREAD_HANDLER.start_run_loop()
