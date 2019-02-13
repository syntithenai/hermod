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
            'hermod/#/speaker/play' : function(destination,siteId,audio) {
               console.log('speaker play');
                if (siteId && siteId.length > 0) { // && siteId === that.props.siteId) {
                    that.playSound(audio).then(function() {
                          //// TODO wait for mqtt mesage    
                          that.sendMqtt("hermod/"+siteId+"/speaker/finished",{}); 
                    }); 
                }
            },
            'hermod/#/hotword/detected': function(topic,siteId,payload) {
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
            if (bytes && that.props.config.enableaudio !== "no") {
                var buffer = new Uint8Array( bytes.length );
                buffer.set( new Uint8Array(bytes), 0 );
                let audioContext = window.AudioContext || window.webkitAudioContext;
                let context = new audioContext();
                let gainNode = context.createGain();
                // initial set volume
                gainNode.gain.value = that.props.config.outputvolume/100 ? that.props.config.outputvolume/100 : 0.5;
                context.decodeAudioData(buffer.buffer, function(audioBuffer) {
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
        });                        
    }
    
    
    
    render() {
        return <span id="Hermodreactspeaker" ></span>
    };
}
