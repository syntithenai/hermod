var fs = require('fs')

var audioDump=[];

function  start(mqttClient,siteId,filename) {		
		var FileWriter = require('wav').FileWriter;	
		let rand=new Date().getTime();
		let daname = filename ? filename : './audio-'+siteId+'-'+rand+'.wav'
		audioDump = new FileWriter(daname, {
		  sampleRate: 16000,
		  channels: 1
		});

		mqttClient.subscribe('hermod/'+siteId+'/microphone/audio')
		mqttClient.on('message', function(message,body) {
			if ('hermod/'+siteId+'/microphone/audio') {
				try {
					//console.log('AUDIODUMP')
					audioDump.push(body);
				} catch (e) {}
			} 
		})
	
}
    
function stop(mqttClient,siteId) {
	mqttClient.unsubscribe('hermod/'+siteId+'/microphone/audio')
	audioDump.push(null);
}

module.exports = {start : start, stop: stop}
