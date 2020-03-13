"""
This script starts all the service classes from config.yml
Complete configuration is passed through to each service
"""

import importlib
import os
import pathlib
import sys
import yaml
import argparse
import paho.mqtt.client as mqtt

from thread_handler import ThreadHandler
THREAD_HANDLER = ThreadHandler()

PARSER = argparse.ArgumentParser(description="Stream from microphone to DeepSpeech using VAD")

PARSER.add_argument('-r', '--run', type=str, default='all',
					help="Run mode - all|server|client")

PARSER.add_argument('-i', '--initialise', type=str, default='',
					help="Send init messages to listed sites to start microphone and hotword. Eg home,default,client1")



ARGS = PARSER.parse_args()
print(ARGS)
print("RUN MODE {} {}".format(ARGS.run,ARGS.initialise))
if ARGS.run:
	SERVICES = []
	F = open(os.path.join(os.path.dirname(__file__), 'config-'+ARGS.run+'.yaml'), "r")
	CONFIG = yaml.load(F.read(), Loader=yaml.FullLoader)

	MODULE_DIR = os.getcwd()
	sys.path.append(MODULE_DIR)
	if len(ARGS.initialise) > 0 and 'DialogManagerService' in CONFIG['services']:
			print('have args init {}'.format(ARGS.initialise))
			CONFIG['services']['DialogManagerService'] = {'initialise' : ARGS.initialise}
		
	for service in CONFIG['services']:
		# force dialog initialise if argument present
		full_path = os.path.join(MODULE_DIR, service + '.py')
		module_name = pathlib.Path(full_path).stem
		module = importlib.import_module(module_name)
		a = getattr(module, service)(CONFIG)
		THREAD_HANDLER.run(target=a.run)

	print('started services')
	THREAD_HANDLER.start_run_loop()
