import json
import time
import os
import pyaudio
import wave
import io

from mqtt_service import MqttService

 # ////hotword/detected => dialog/end then wait dialog/ended then dialog/started, microphone/start, asr/start
 # ////dialog/start => if text then dialog/started, asr/stop, nlu/parse ELSE  dialog/started, microphone/start, asr/start
 # ////dialog/continue => if text then tts/say then wait tts/finished then  microphone/start, asr/start    ELSE microphone/start, asr/start
 # ////asr/text => asr/stop, hotword/stop, microphone/stop, nlu/parse
 # ////nlu/intent => intent
 # ////nlu/fail => dialog/end
 # ////dialog/end => dialog/ended, microphone/start, hotword/start
 # ////router/action => action

class dialog_manager_service(MqttService):
  
    def __init__(
            self,
            config
            ):
        super(dialog_manager_service, self).__init__(config['mqtt_hostname'],config['mqtt_port'],config['site'])
        self.config = config
        self.site = config['site']
        self.volume = 5    
        self.subscribe_to='hermod/'+self.site+'/speaker/play,hermod/'+self.site+'/speaker/stop,hermod/'+self.site+'/speaker/volume'
    
     
   
    def on_message(self, client, userdata, msg):
        self.log('ONMESS')
        topic = "{}".format(msg.topic)
        self.log("ssMESSAGE {}".format(topic))
        playTopic = 'hermod/' +self.site+'/speaker/play'
        stopTopic = 'hermod/'+self.site+'/speaker/stop'
        volumeTopic = 'hermod/'+self.site+'/speaker/volume'
        if topic == playTopic:
            self.log('match play')
            self.startPlaying(msg.payload)
            self.log('matcher play')
            
        elif topic == stopTopic:
            self.stopPlaying()
        elif topic == volumeTopic:
            self.volume = msg.payload;
     
     
    def startPlaying(self,wav):
        self.log('start playing1 '+ "hermod/"+self.site+"/speaker/started")

        self.client.publish("hermod/"+self.site+"/speaker/started",json.dumps({}));
        self.log('start playing2')
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
        self.log('start playing3')
        
        while data != None and remaining > 0:
            stream.write(data)
            data = wf.readframes(CHUNK)
            remaining = remaining - CHUNK
        
        self.log('stop playing')
        
        stream.stop_stream()
        stream.close()

        p.terminate()
        self.client.publish("hermod/"+self.site+"/speaker/finished",json.dumps({}));
        
    def stopPlaying(wav):
        stream.stop_stream()
        stream.close()

        p.terminate()
    
