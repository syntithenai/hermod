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
            self).__init__(
                config['mqtt_hostname'],
                config['mqtt_port'],
                config['site'])
        self.config = config
        self.site = config['site']
        self.volume = 5
        self.subscribe_to = 'hermod/' + self.site + '/speaker/#'

    def on_message(self, client, userdata, msg):
        topic = "{}".format(msg.topic)
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
        # determine which audio device
        # create and run all the services listed in config.yaml
        p = pyaudio.PyAudio()
        pulseIndex = -1
        defaultIndex = -1
        useIndex = -1
        for i in range(
                p.get_device_count()):  # list all available audio devices
            dev = p.get_device_info_by_index(i)
            if dev['name'] == 'pulse':
                pulseIndex = i
            if dev['name'] == 'default':
                defaultIndex = i

        # use pulse if available
        if pulseIndex >= 0:
            useIndex = pulseIndex
        elif defaultIndex >= 0:
            useIndex = defaultIndex

        if useIndex < 0:
            print('no suitable speaker device')
        else:
# print(['SPEAKER USE DEV',useIndex,p.get_device_info_by_host_api_device_index(0,useIndex)])
            remaining = len(wav)
            wf = wave.open(io.BytesIO(bytes(wav)), 'rb')
            CHUNK = 256
            stream = p.open(format=p.get_format_from_width(wf.getsampwidth()),
                            channels=wf.getnchannels(),
                            rate=wf.getframerate(),
                            output=True, output_device_index=useIndex)

            data = wf.readframes(CHUNK)
            remaining = remaining - CHUNK

            while data is not None and remaining > 0:
                stream.write(data)
                data = wf.readframes(CHUNK)
                remaining = remaining - CHUNK

            self.client.publish("hermod/" + self.site +
                                "/speaker/finished", json.dumps({"id": playId}))
            stream.stop_stream()
            stream.close()

        p.terminate()

    def stop_playing(self, playId):
        stream.stop_stream()
        stream.close()

        p.terminate()
        self.client.publish("hermod/" + self.site +
                            "/speaker/finished", json.dumps({"id": playId}))
