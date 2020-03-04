#!/usr/bin/python

import json
import time
import os
import pyaudio
import wave
import io

import json

from mqtt_service import MqttService



class microphone_service(MqttService):
  
    def __init__(
            self,
            config
            ):
        super(microphone_service, self).__init__(config['mqtt_hostname'],config['mqtt_port'],config['site'])
        self.config = config

        self.site = config['site']
            
        self.thread_targets.append(self.sendAudioFrames)    
        self.started = False
        self.subscribe_to='hermod/'+self.site+'/microphone/start,hermod/'+self.site+'/microphone/stop'
    

    def on_message(self, client, userdata, msg):
        topic = "{}".format(msg.topic)
        self.log("MESSAGE {}".format(topic))
        startTopic = 'hermod/' +self.site+'/microphone/start'
        stopTopic = 'hermod/'+self.site+'/microphone/stop'
        if topic == startTopic:
            self.started = True ;
        elif topic == stopTopic:
            self.started = False;
        
        
            
    def sendAudioFrames(self,run_event):
         
        audio = pyaudio.PyAudio()
        stream = audio.open(format=pyaudio.paInt16, channels=1,
                        rate=16000, input=True,
                        frames_per_buffer=256)
        while True  and run_event.is_set():
            frames = stream.read(256)
            if (self.started):
                # generate wav file in memory
                output = io.BytesIO()
                waveFile = wave.open(output, "wb")
                waveFile.setnchannels(1)
                waveFile.setsampwidth(2)
                waveFile.setframerate(16000)
                waveFile.writeframes(frames) 
                #waveFile.close()
                topic = 'hermod/'+self.site+'/microphone/audio'.format(self.site)
                self.client.publish(topic, payload=output.getvalue(),qos=0)
                #output.close()  # discard buffer memory
