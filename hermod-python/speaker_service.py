import json
import time
import os
import pyaudio
import wave
import io

from mqtt_service import MqttService



class speaker_service(MqttService):
  
    def __init__(
            self,
            config
            ):
        super(speaker_service, self).__init__(config['mqtt_hostname'],config['mqtt_port'],config['site'])
        self.config = config
        self.site = config['site']
        self.volume = 5    
        self.subscribe_to='hermod/'+self.site+'/speaker/play,hermod/'+self.site+'/speaker/play/#,hermod/'+self.site+'/speaker/stop,hermod/'+self.site+'/speaker/volume'
    
     
   
    def on_message(self, client, userdata, msg):
        topic = "{}".format(msg.topic)
       # self.log("ssMESSAGE {}".format(topic))
        playTopic = 'hermod/' +self.site+'/speaker/play'
        stopTopic = 'hermod/'+self.site+'/speaker/stop'
        volumeTopic = 'hermod/'+self.site+'/speaker/volume'
       # self.log("ssMESSAGETop {}".format(playTopic))
        
        if topic.startswith(playTopic):
            ptl = len(playTopic) +1
            playId = topic[ptl:]
            #self.log("playID {}".format(playId))
            self.startPlaying(msg.payload,playId)
        elif topic == stopTopic:
            self.stopPlaying(playId)
        elif topic == volumeTopic:
            self.volume = msg.payload;
     
     
    def startPlaying(self,wav,playId):
        self.client.publish("hermod/"+self.site+"/speaker/started",json.dumps({"id":playId}));
        remaining = len(wav)
        wf = wave.open(io.BytesIO(bytes(wav)), 'rb')
        p = pyaudio.PyAudio()
        CHUNK = 256
        stream = p.open(format=p.get_format_from_width(wf.getsampwidth()),
                        channels=wf.getnchannels(),
                        rate=wf.getframerate(),
                        output=True)

        data = wf.readframes(CHUNK)
        remaining = remaining - CHUNK
        
        while data != None and remaining > 0:
            stream.write(data)
            data = wf.readframes(CHUNK)
            remaining = remaining - CHUNK
        
        self.log('FINISHED READING speker')
        self.client.publish("hermod/"+self.site+"/speaker/finished",json.dumps({"id":playId}));
        stream.stop_stream()
        stream.close()

        p.terminate()
        
        
    def stopPlaying(self,playId):
        stream.stop_stream()
        stream.close()

        p.terminate()
        self.client.publish("hermod/"+self.site+"/speaker/finished",json.dumps({"id":playId}));
        
