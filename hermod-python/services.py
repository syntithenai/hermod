import json
from importlib import import_module

services = []

f = open("config.js", "r")
config = json.loads(f.read())
print(config)

for service in config['services']:
	print(service) 
	t = import_module('.'+service, package=__name__)
	t.run();
    	
