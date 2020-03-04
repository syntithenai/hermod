import yaml
import glob, importlib, os, pathlib, sys

from thread_handler import ThreadHandler
thread_handler = ThreadHandler()
        

# create and run all the services listed in config.yaml

services = []
f = open(os.path.join(os.path.dirname(__file__), 'config.yaml'), "r")
config = yaml.load(f.read())

MODULE_DIR = os.getcwd()
sys.path.append(MODULE_DIR)

for service in config['services']:
	full_path = os.path.join(MODULE_DIR, service+'.py')
	#print(full_path) 
	module_name = pathlib.Path(full_path).stem
	module = importlib.import_module(module_name)
	#print("service - {}".format(getattr(module,service)))
	#sys.stdout.flush()
	a = getattr(module,service)(config)
	thread_handler.run(target=a.run)
	#a.run()
        
thread_handler.start_run_loop()
