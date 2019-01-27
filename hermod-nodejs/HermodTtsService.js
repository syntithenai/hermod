var HermodService = require('./HermodService')

class HermodTtsService extends HermodService  {

    constructor(props) {
        super(props);
        let that = this;
        if (!this.props.siteId || this.props.siteId.length === 0) {
            throw "TTS must be configured with a siteId property";
        }
        let eventFunctions = {
        // SESSION
            'hermod/#/tts/say' : function(topic,siteId,payload) {
				if (payload.text && payload.text.length > 0 ) {
					that.say(payload.text).then(function() {
						that.sendMqtt('hermod/' + props.siteId + '/tts/sayFinished',{id:payload.id});    
					});
				}
            }
        }
        this.ttsBinary = props.ttsBinary ? props.ttsBinary : 'pico2wave' 
        this.ttsOutputDirectory = props.ttsOutputDirectory ? props.ttsOutputDirectory : '/tmp'
        this.manager = this.connectToManager(props.manager,eventFunctions);
    }  
        
  

   /**
     * Synthesise speech from text and send to to audio output
     */ 
    say(text) {
		let that = this;
		return new Promise(function(resolve,reject) {
			const randomFileName=that.ttsOutputDirectory + "/" + String(parseInt(Math.random() * 10000,10) ) + '.wav'
			const command = that.ttsBinary + " -w " + randomFileName + " " + "'" + text + "'";
			const exec = require("child_process").exec
			exec(command, (error, stdout, stderr) => {
				// stream the file
				var fs = require('fs');
				fs.readFile(randomFileName	, function(err, wav) {
					that.manager.sendAudioMqtt("hermod/"+that.props.siteId+"/speaker/play",wav);
					fs.unlink(randomFileName)
				});
				
			})
			resolve()
		})
    }
}
module.exports = HermodTtsService
