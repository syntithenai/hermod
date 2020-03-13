"""
This class captures audio from the available hardware and streams mqtt audio packets
Streaming is enabled by a microphone/start message and stopped by microphone/stop
This service is preconfigured for a single site.
"""

import wave
import io
import pyaudio
import time

from mqtt_service import MqttService


class MicrophoneService(MqttService):
    """
    Microphone Service Class
    """
    def __init__(
            self,
            config
    ):
        super(
            MicrophoneService,
            self).__init__(
                config['mqtt_hostname'],
                config['mqtt_port'],
                config['site'])
        self.config = config

        self.site = config['site']

        self.thread_targets.append(self.send_audio_frames)
        self.started = False
        self.subscribe_to = 'hermod/' + self.site + \
            '/microphone/start,hermod/' + self.site + '/microphone/stop'

    def on_message(self, client, userdata, msg):
        topic = "{}".format(msg.topic)
        if topic == 'hermod/' + self.site + '/microphone/start':
            self.started = True
        elif topic == 'hermod/' + self.site + '/microphone/stop':
            self.started = False

    def send_audio_frames(self, run_event):
        # determine which audio device
        pulseIndex = -1
        defaultIndex = -1
        useIndex = -1
        p = pyaudio.PyAudio()
        info = p.get_host_api_info_by_index(0)
        numdevices = info.get('deviceCount')
        # for each audio device, determine if is an input or an output and add
        # it to the appropriate list and dictionary
        for i in range(0, numdevices):
            if p.get_device_info_by_host_api_device_index(
                    0, i).get('maxInputChannels') > 0:
                devName = p.get_device_info_by_host_api_device_index(
                    0, i).get('name')
                if devName == 'pulse':
                    pulseIndex = i
                if devName == 'default':
                    defaultIndex = i

        # use pulse if available
        if pulseIndex >= 0:
            useIndex = pulseIndex
        elif defaultIndex >= 0:
            useIndex = defaultIndex

        if useIndex < 0:
            print('no suitable mic device')
        else:
           # print(['MIC USE DEV',useIndex,p.get_device_info_by_host_api_device_index(0,useIndex)])
            audio = pyaudio.PyAudio()
            stream = audio.open(
                format=pyaudio.paInt16,
                channels=1,
                rate=16000,
                input=True,
                frames_per_buffer=256,
                input_device_index=useIndex)
            while True and run_event.is_set():
                time.sleep(0.1)
                frames = stream.read(256)
                if self.started:
                    # generate wav file in memory
                    output = io.BytesIO()
                    waveFile = wave.open(output, "wb")
                    waveFile.setnchannels(1)
                    waveFile.setsampwidth(2)
                    waveFile.setframerate(16000)
                    waveFile.writeframes(frames)
                    topic = 'hermod/' + self.site + \
                        '/microphone/audio'
                    self.client.publish(
                        topic, payload=output.getvalue(), qos=0)
