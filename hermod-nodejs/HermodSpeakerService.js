var HermodService = require('./HermodService')
var stream = require('stream') 
var Readable = stream.Readable;
var pcm = require('pcm-util')
//var wav = require('node-wav');
var Speaker = require("speaker");
//var readChunk = require('read-chunk'); 
var audioType = require('audio-type');
var lame = require("lame");
var fs = require("fs");
var volume = require("pcm-volume");

var wav = require('wav');
			
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
        // SESSION
            'hermod/#/speaker/play' : function(destination,siteId,audio) {
                //if (siteId && siteId.length > 0 && siteId === that.props.siteId) {
                    that.playSound(audio).then(function() {
                          that.sendMqtt("hermod/"+siteId+"/speaker/playFinished",{}); 
                    }); 
                //}
            },
            'hermod/#/speaker/stop' : function(topic,siteId,payload) {
				that.stopPlaying()
			},
            'hermod/#/speaker/volume' : function(topic,siteId,payload) {
				that.setVolume(payload.volume)
			}
        } 
        this.manager = this.connectToManager(props.manager,eventFunctions);
    }  
   
    /* Set volume between 0 and 1 */
    setVolume(volume) {
        console.log('set volume '+volume)
        this.volume.setVolume(volume)
    };
    
    /** Stop playing immediately */
    // TODO THIS DOESN'T WORK- HOW TO STOP A NODEJS STREAM ??
   	stopPlaying() {
		let that = this;
		return new Promise(function(resolve,reject) {
			if (that.reader) {
				//onsole.log([that.reader])
				try {
					that.reader.pause();
					that.reader.emit('end')
				} catch(e) {
					console.log(e)
				}
				that.reader = null;
				console.log('stopped');
			}
			resolve();		
		});
	}
    
	playSound(buffer) {
		let that = this;
		this.volume = new volume();
		this.setVolume(this.props.volume ? this.props.volume : 1)	
        return new Promise(function(resolve,reject) {
			that.stopPlaying().then(function() {
				try {
					let mediaType = audioType(buffer);
					if (mediaType ==="mp3") {
						var decoder = new lame.Decoder({
							channels: 2,
							bitDepth: 16,
							sampleRate: 44100,
						});
						var speaker = new Speaker({channels:2,depth:16,rate:44100})
						
						const readable = new Readable()
						that.reader = readable;
						readable._read = () => {} // _read is required but you can noop it
						readable.push(buffer)
						readable.push(null)
						readable.pipe(decoder) 
						decoder.pipe(that.volume)
						that.volume.pipe(speaker)
						
					} else if (mediaType ==="wav") {
						var reader = new wav.Reader();
						// the "format" event gets emitted at the end of the WAVE header
						var speaker = null
						reader.on('format', function (format) {					 
						  // the WAVE header is stripped from the output of the reader
						  speaker = new Speaker(format);
						  that.volume.pipe(speaker)
						});
						
						const readable = new Readable()
						that.reader = reader;
						readable._read = () => {} // _read is required but you can noop it
						readable.push(buffer)
						readable.push(null)
						
						readable.pipe(reader).pipe(that.volume)
					}
				} catch (e) {
					console.log(['PIPE ERROR',e])
				}
			});
		});
	}
	
    
    
}
module.exports = HermodSpeakerService
