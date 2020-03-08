
import yaml
import glob, importlib, os, pathlib, sys
import pyaudio

from thread_handler import ThreadHandler
thread_handler = ThreadHandler()

p = pyaudio.PyAudio()
        
print('start services {}')
#print('audio count {} devices'.format(p.get_device_count()))
sys.stdout.flush()  

# create and run all the services listed in config.yaml
# for i in range(p.get_device_count()):#list all available audio devices
  # dev = p.get_device_info_by_index(i)
  # print((i,dev['name'],dev['maxInputChannels']))
# sys.stdout.flush()  


# p = pyaudio.PyAudio()
# info = p.get_host_api_info_by_index(0)
# numdevices = info.get('deviceCount')
# #for each audio device, determine if is an input or an output and add it to the appropriate list and dictionary
# for i in range (0,numdevices):
        # if p.get_device_info_by_host_api_device_index(0,i).get('maxInputChannels')>0:
                # print([ "Input Device id ", i, " - ", p.get_device_info_by_host_api_device_index(0,i).get('name')])
# for i in range (0,numdevices):
        # if p.get_device_info_by_host_api_device_index(0,i).get('maxOutputChannels')>0:
                # print([ "Output Device id ", i, " - ", p.get_device_info_by_host_api_device_index(0,i).get('name')])

# sys.stdout.flush()  

# exit()

  
services = []
f = open(os.path.join(os.path.dirname(__file__), 'config.yaml'), "r")
config = yaml.load(f.read(), Loader=yaml.FullLoader)

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
