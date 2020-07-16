var Chunker = require('stream-chunker');
var fs = require('fs')
let dastream = null;
function  start(mqttClient,siteId,filename) {
	
	var chunker = Chunker(512,{flush:true});
	chunker.on('data', function(data) {
		mqttClient.publish("hermod/"+siteId+"/microphone/audio",data);
	});
	 
	var wavConfig = {
	  "channels": 1,
	  "sampleRate": 16000,
	  "bitDepth": 16
	};
	dastream = fs.createReadStream(filename);
	console.log('stream '+filename)
	
	var wav = require('wav');
	var wavReader = new wav.Reader(wavConfig);
	var inBody = false;
	// strip the wav header
	wavReader.on('format', function (format) {					 
	//   the WAVE header is stripped from the output of the reader
	 inBody = true;
	});
	wavReader.on('data', function (data) {
		if (inBody ) { //&& data && data.length > 0
			chunker.write(data);
		}
	});
	dastream.pipe(wavReader);
}
    
function stopRecording(siteId) {
		if (dastream) {
			dastream.pause();
			dastream.destroy();
		}
	}


module.exports = {start : start, stop:stopRecording}
