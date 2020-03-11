#######################################################
# This script starts all the service classes from config.yml
# Complete configuration is passed through to each service
#######################################################

import yaml

import glob, importlib, os, pathlib, sys
import pyaudio

from thread_handler import ThreadHandler
thread_handler = ThreadHandler()
  
services = []
f = open(os.path.join(os.path.dirname(__file__), 'config.yaml'), "r")
config = yaml.load(f.read(), Loader=yaml.FullLoader)

MODULE_DIR = os.getcwd()
sys.path.append(MODULE_DIR)

for service in config['services']:
	full_path = os.path.join(MODULE_DIR, service+'.py')
	module_name = pathlib.Path(full_path).stem
	module = importlib.import_module(module_name)
	a = getattr(module,service)(config)
	thread_handler.run(target=a.run)

print('started services')        
thread_handler.start_run_loop()
