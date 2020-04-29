import pyaudio

p = pyaudio.PyAudio()
info = p.get_host_api_info_by_index(0)
print(info)
print('========================================================================================')
print('========================================================================================')
numdevices = info.get('deviceCount')
useIndex = -1
for i in range(0, numdevices):
    # ensure input channels and sample rate when selecting device
    if p.get_device_info_by_host_api_device_index(
            0, i).get('maxOutputChannels') > 0:
        useIndex = i
        print('========================================================================================')
        print(p.get_device_info_by_host_api_device_index(0,i))
        #break;
