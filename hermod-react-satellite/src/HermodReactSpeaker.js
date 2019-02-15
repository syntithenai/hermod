import React from 'react'
import {Component} from 'react'
import HermodReactComponent from './HermodReactComponent'

export default class HermodReactSpeaker extends HermodReactComponent  {

    constructor(props) {
        super(props);
        let that = this;
        
        if (!props.siteId || props.siteId.length === 0) {
            throw "Speaker must be configured with a siteId property";
        }
        this.playSound = this.playSound.bind(this);
        this.setVolume = this.setVolume.bind(this);
        this.state = {volume:.5}
        
        let eventFunctions = {
        // SESSION
            'hermod/+/speaker/play' : function(destination,siteId,audio) {
               console.log(['speaker play',destination,siteId,audio]);
                if (siteId && siteId.length > 0) { // && siteId === that.props.siteId) {
                    //that.sendMqtt("hermod/"+siteId+"/speaker/started",{}); 
						
                    that.playSound(audio).then(function() {
                        //// TODO wait for mqtt mesage    
                        console.log('played then');
                        that.sendMqtt("hermod/"+siteId+"/speaker/finished",{}); 
						console.log('message');
                    }); 
                }
            },
            'hermod/+/hotword/detected': function(topic,siteId,payload) {
                // quarter volume for 10 seconds
            }
        }
        
        this.logger = this.connectToLogger(props.logger,eventFunctions);
    }  
   
   
    setVolume(volume) {
       // console.log(['SET VOLUME']);
        this.setState({volume:volume});
        //this.gainNode.gain.value = this.state.volume;
    };
    
    playSound(bytes) {
        let that = this;
        console.log('PLAY SOUND BYTES')
        return new Promise(function(resolve,reject) {
            try {
				if (bytes && that.props.config && that.props.config.enableaudio !== "no") {
		// console.log(['PLAY SOUND BYTES 2',(bytes ? bytes.length : 'no sound')])
       			var buffer = new Uint8Array( bytes.length );
		// console.log('PLAY SOUND BYTES 3')
       			buffer.set( new Uint8Array(bytes), 0 );
		 //console.log('PLAY SOUND BYTES 4')
       			let audioContext = window.AudioContext || window.webkitAudioContext;
		// console.log('PLAY SOUND BYTES 5')
       			let context = new audioContext();
		// console.log('PLAY SOUND BYTES 6')
       			let gainNode = context.createGain();
		// console.log('PLAY SOUND BYTES 7')
       			// initial set volume
					gainNode.gain.value = that.props.config && that.props.config.outputvolume/100 ? that.props.config.outputvolume/100 : 0.5;
		// console.log('PLAY SOUND BYTES 8')
		 //console.log([buffer,buffer.buffer])
       			context.decodeAudioData(buffer.buffer, function(audioBuffer) {
		console.log('DECODE SOUND BYTES')
       				
						var source = context.createBufferSource();
						source.buffer = audioBuffer;
						source.connect(gainNode);
						gainNode.connect( context.destination );
						source.start(0);
						source.onended = function() {
							resolve();
						};
					});
				} else {
					resolve();
				}
			} catch (e) {
				console.log(e)
			}
        });                        
    }
    
    
    
    render() {
        return <span id="Hermodreactspeaker" ></span>
    };
}
