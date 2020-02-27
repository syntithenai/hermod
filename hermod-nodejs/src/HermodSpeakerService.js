var HermodService = require('./HermodService')
var stream = require('stream') 
var Readable = stream.Readable;
var Speaker = require("speaker");
var audioType = require('audio-type');

var fs = require("fs");
var wav = require('wav');

//var pcm = require('pcm-util')
var volume = require("pcm-volume");

			
class HermodSpeakerService extends HermodService {

    constructor(props) {
        super(props ? props : {});
        let that = this;
        if (!this.props.siteId || this.props.siteId.length === 0) {
            throw "Speaker must be configured with a siteId property";
        }
        // Create a volume instance
        this.reader = null;
		this.volume = new volume();
		this.setVolume(props.volume ? props.volume : 1)	
        let eventFunctions = {
            'hermod/+/speaker/play' : function(destination,siteId,audio) {
			//	console.log(['SPEAKER SERVICE play',destination,siteId,audio]);
                    that.sendMqtt("hermod/"+siteId+"/speaker/started",{});
                    that.playSound(audio).then(function() {
                    		  that.sendMqtt("hermod/"+siteId+"/speaker/finished",{}); 
					}); 
            },
            'hermod/+/speaker/stop' : function(topic,siteId,payload) {
				that.stopPlaying()
			},
            'hermod/+/speaker/volume' : function(topic,siteId,payload) {
				that.setVolume(payload.volume)
			}
        } 
        this.manager = this.connectToManager('SPEAKER',props.manager,eventFunctions,false);
    }  
   
    /* Set volume between 0 and 1 */
    setVolume(volume) {
        this.volume.setVolume(volume)
    };
    
    /** Stop playing immediately */
    // TODO THIS DOESN'T WORK- HOW TO STOP A NODEJS STREAM ??
   	stopPlaying() {
		let that = this;
		return new Promise(function(resolve,reject) {
			if (that.reader) {
				try {
					that.reader.pause();
					that.reader = null;
				} catch(e) {
					console.log(e)
				}
				that.reader = null;
			}
			resolve();		
		});
	}
    
	playSound(buffer) {
		let that = this;
		this.volume = new volume();
		this.setVolume(this.props.volume ? this.props.volume : 1)	
        //let playTimout = null
        return new Promise(function(resolve,reject) {
			//playTimout = setTimeout(function() {
				//resolve();
			//},10000);
			
			that.stopPlaying().then(function() {
				try {
					let mediaType = audioType(buffer);
					if (mediaType ==="mp3") {
						const Lame = require("node-lame").Lame;

						const decoder = new Lame({
						    "output": "buffer"
						}).setBuffer(buffer);

						decoder.decode()
						    .then(() => {
							// Decoding finished
							const wavBuffer = decoder.getBuffer();
						    	var speaker = new Speaker({channels:2,depth:16,rate:44100})
							
							const readable = new Readable()
							that.reader = readable;
							readable._read = () => {} // _read is required but you can noop it
							readable.push(wavBuffer)
							readable.push(null)
							readable.pipe(decoder) 
							decoder.pipe(that.volume)
							that.volume.pipe(speaker)
							decoder.on('end',function() {
								resolve();
							
							});

						    })
						    .catch((error) => {
							// Something went wrong
						    });
						
						
						//var decoder = new lame.Decoder({
							//channels: 2,
							//bitDepth: 16,
							//sampleRate: 44100,
						//});
						
					} else if (mediaType ==="wav") {
						var reader = new wav.Reader();
						var speaker = null
						reader.on('format', function (format) {					 
						  speaker = new Speaker(format);
							speaker.on('close',function() {
								resolve();
							});
						  that.volume.pipe(speaker)
						});
						const readable = new Readable()
						that.reader = reader;
						readable._read = () => {} // _read is required but you can noop it
						readable.push(buffer)
						readable.push(null)
						
						readable.pipe(reader).pipe(that.volume)
					} else {
						resolve();
					}
				} catch (e) {
					console.log(['PIPE ERROR',e])
				}
			});
		});
	}
	
    
    
}
module.exports = HermodSpeakerService
