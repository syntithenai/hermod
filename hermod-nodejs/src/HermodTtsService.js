var HermodService = require('./HermodService')

class HermodTtsService extends HermodService  {

    constructor(props) {
        super(props);
        //console.log('tts construct')
        //console.log(props)
        let that = this;
        let eventFunctions = {
            'hermod/+/tts/say' : function(topic,siteId,payload) {
				//console.log(['TTSSAY',topic,siteId,payload])
				if (payload.text && payload.text.length > 0 ) {
					//console.log('tts message')
					that.say(payload.text,siteId,payload).then(function() {
					});
				}
            }
        }
        
        this.ttsBinary = props.ttsBinary ? props.ttsBinary : '/usr/bin/pico2wave' 
        this.ttsOutputDirectory = props.ttsOutputDirectory ? props.ttsOutputDirectory : '/tmp'
        this.manager = this.connectToManager('TTS',props.manager,eventFunctions,false);
        
    }  
        
  

   /**
     * Synthesise speech from text and send to to audio output
     */ 
    say(text,siteId,payload) {
		let that = this;
		//console.log('say ');
				
		return new Promise(function(resolve,reject) {
			const randomFileName=that.ttsOutputDirectory + "/" + String(parseInt(Math.random() * 10000,10) ) + '.wav'
			const command = that.ttsBinary + " -w " + randomFileName + " " + "'" + text + "'";
			that.sendMqtt('hermod/'+siteId+'/tts/started',{id:payload.id})
			if (!text || text.trim().length ==0) {
				that.sendMqtt('hermod/'+siteId+'/tts/finished',{id:payload.id})
			} else {			
				const exec = require("child_process").exec
				exec(command, (error, stdout, stderr) => {
					//console.log('say execed');
					// stream the file
					var fs = require('fs');
					fs.readFile(randomFileName	, function(err, wav) {
						//console.log('read file ');
						if (err || wav.length > 0) {
							that.sendMqtt('hermod/'+siteId+'/tts/finished',{id:payload.id})
						} else {
							let callbacks = {}
							callbacks['hermod/'+siteId+'/speaker/finished'] = function() {
								that.sendMqtt('hermod/'+siteId+'/tts/finished',{id:payload.id})
								fs.unlink(randomFileName,function() {})
							}
							// automatic cleanup after single message with true parameter
							that.manager.addCallbacks('TTS',callbacks,true)
							//console.log('say added callbavvck');
							that.manager.sendAudioMqtt("hermod/"+siteId+"/speaker/play",wav);
						}
					});
				})
			}
			resolve()
		})
    }
}
module.exports = HermodTtsService
