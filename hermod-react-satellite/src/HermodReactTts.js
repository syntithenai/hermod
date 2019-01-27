import React, { Component } from 'react'
import HermodReactComponent from './HermodReactComponent'

export default class HermodReactTts extends HermodReactComponent  {

    constructor(props) {
        super(props);
        if (!props.siteId || props.siteId.length === 0) {
            throw "TTS Server must be configured with a siteId property";
        }
        //this.props.config={}
        let that = this;
        let eventFunctions = {
        // SESSION
            'hermod/tts/say' : function(payload) {
                if (payload.siteId && payload.siteId.length > 0 && payload.siteId === props.siteId) {
                    if (payload.text && payload.text.length > 0 ) {
                        that.say(payload.text);
                    }
                    that.sendMqtt('hermod/tts/sayFinished',{id:payload.id,sessionId:payload.sessionId});    
            
                }
            }
        }
        
        this.logger = this.connectToLogger(props.logger,eventFunctions);
    }  
    
    componentDidMount() {
        this.initSpeechSynthesis();
    };
    
  

   /**
     * Synthesise speech from text and send to to audio output
     */ 
    say(text) {
        console.log(['TTS SAY',this.props,this.props.config,this.props.config.enablevoice]);
        if (this.props.config.enabletts !== "no") {
            let voice = this.props.config && this.props.config.ttsvoice ? this.props.config.ttsvoice : 'default';
            
            if (voice === "default") {
                // js generated fallback
                speak(text,{
                    amplitude : !isNaN(parseFloat(this.props.config.voicevolume)) ? parseFloat(this.props.config.voicevolume) : 70,
                    pitch: !isNaN(parseFloat(this.props.config.voicepitch)) ? parseFloat(this.props.config.voicepitch) : 50,
                    speed : !isNaN(parseFloat(this.props.config.voicerate)) ? parseFloat(this.props.config.voicerate) * 2.2 : 175
                });
            } else {
                // Create a new instance of SpeechSynthesisUtterance.
                var msg = new SpeechSynthesisUtterance();
                msg.text = text;
                msg.volume = !isNaN(parseFloat(this.props.config.voicevolume)) ? parseFloat(this.props.config.voicevolume) : 50;
                msg.rate = !isNaN(parseFloat(this.props.config.voicerate)) ? parseFloat(this.props.config.voicerate)/100 : 50/100;
                msg.pitch = !isNaN(parseFloat(this.props.config.voicepitch)) ? parseFloat(this.props.config.voicepitch) : 50;
                var voices = speechSynthesis.getVoices();
      
              // Loop through each of the voices.
                voices.forEach(function(voiceItem, i) {
                    if (voiceItem.name === voice) msg.voice = voiceItem;
                    window.speechSynthesis.speak(msg);
                });
            }
            
        }
    }
    
    initSpeechSynthesis() {
        let that = this;
        if ('speechSynthesis' in window) {
            // Fetch the list of voices and populate the voice options.
            function loadVoices() {
              // Fetch the available voices.
                var voices = speechSynthesis.getVoices();
              
              // Loop through each of the voices
                let voiceOptions=[];
                voices.forEach(function(voice, i) {
                // Create a new option element.
                    voiceOptions.push({'name':voice.name,label:voice.name});
                });
                voiceOptions.push({'name':'default',label:'Browser Generated'});
                that.setState({voices:voiceOptions});
                //console.log(['VOICES a',voiceOptions]);
            }

            // Execute loadVoices.
            loadVoices();

            // Chrome loads voices asynchronously.
            window.speechSynthesis.onvoiceschanged = function(e) {
              loadVoices();
            };
            
        } else {
            let voiceOptions=[];
            voiceOptions.push({'name':'default',label:'Browser Generated'});
            that.setState({voices:voiceOptions});
        }
       // console.log(['LOADED VOICES',this.state.voices]);
    };

    render() {
        return <b id="Hermodreacttts" ></b>
    };

  
}

