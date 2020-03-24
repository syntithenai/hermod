"""
# This class captures  mqtt audio packets and streams the audio to available hardware
# Streaming is started by a speaker/play message and stopped by speaker/stop
# This service is preconfigured for a single site.
"""

import json
import pyaudio
import wave
import io

from mqtt_service import MqttService

class SpeakerService(MqttService):
    """ Speaker Service Class """
    def __init__(
            self,
            config
    ):
        super(
            SpeakerService,
            self).__init__(config)
        self.config = config
        self.site = config.get('site','default')
        self.volume = 5
        self.subscribe_to = 'hermod/' + self.site + '/speaker/#'
        self.p = pyaudio.PyAudio()
        

    def on_message(self, client, userdata, msg):
        topic = "{}".format(msg.topic)
        self.log('message')
        self.log(topic)
        if topic.startswith('hermod/' + self.site + '/speaker/play'):
            ptl = len('hermod/' + self.site + '/speaker/play') + 1
            playId = topic[ptl:]
            self.start_playing(msg.payload, playId)
        elif topic == 'hermod/' + self.site + '/speaker/stop':
            self.stop_playing(playId)
        elif topic == 'hermod/' + self.site + '/speaker/volume':
            self.volume = msg.payload

    def start_playing(self, wav, playId):
        self.client.publish("hermod/" + self.site +
                            "/speaker/started", json.dumps({"id": playId}))
        info = self.p.get_host_api_info_by_index(0)
        numdevices = info.get('deviceCount')
        useIndex = -1
            
        # device from config, first match
        devices = []
        device = self.config['services']['SpeakerService'].get('device',False)
        if not device:
            device = 'default'
        for i in range(0, numdevices):
            if useIndex < 0 and self.p.get_device_info_by_host_api_device_index(0, i).get('maxOutputChannels') > 0:
                devices.append(self.p.get_device_info_by_host_api_device_index(0, i).get('name'))
                if self.config['services']['SpeakerService'].get('device') in self.p.get_device_info_by_host_api_device_index(0, i).get('name') :
                    # only use the first found
                    if useIndex < 0:
                        useIndex = i
       
        
        #useIndex = 2
        if useIndex < 0:
            self.log('no suitable speaker device')
            self.log('Available output devices:')
            self.log(devices)
        else:
            self.log(['SPEAKER USE DEV',useIndex,self.p.get_device_info_by_host_api_device_index(0,useIndex)])
            self.log('Available output devices:')
            self.log(devices)
            remaining = len(wav)
            wf = wave.open(io.BytesIO(bytes(wav)), 'rb')
            CHUNK = 256
            stream = self.p.open(format=self.p.get_format_from_width(wf.getsampwidth()),
                            channels=wf.getnchannels(),
                            rate=wf.getframerate(),
                            output=True, output_device_index=useIndex)

            data = wf.readframes(CHUNK)
            remaining = remaining - CHUNK
            #self.log('first')
            while data is not None and remaining > 0:
                #self.log('next1')
                stream.write(data)
                #self.log('next2')
                data = wf.readframes(CHUNK)
                #self.log('next3')
                remaining = remaining - CHUNK
                #self.log('next4')
            self.log('last')
            self.client.publish("hermod/" + self.site +
                                "/speaker/finished", json.dumps({"id": playId}))
            stream.stop_stream()
            stream.close()

        #p.terminate()

    def stop_playing(self, playId):
        stream.stop_stream()
        stream.close()

        #p.terminate()
        self.client.publish("hermod/" + self.site +
                            "/speaker/finished", json.dumps({"id": playId}))
