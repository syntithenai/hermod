/* global window */
/* global Paho */
/* global Porcupine */
/* global PicovoiceAudioManager */

import React, { Component } from 'react'
import HermodReactComponent from './HermodReactComponent'
import Resources from './resources'

export default class HermodReactHotwordServer extends HermodReactComponent {

   constructor(props) {
        super(props);
        this.sensitivities = new Float32Array([1]);
        this.hotwordManager =  null;
        if (!props.siteId || props.siteId.length === 0) {
            throw "HOTWORD Server must be configured with a siteId property";
        }
        let that = this;
        
        this.gainNode = null;
        this.hotwordId = this.props.hotwordId && this.props.hotwordId.length > 0 ? this.props.hotwordId : 'default';
        
        this.sendHotwordDetected = this.sendHotwordDetected.bind(this);
        this.sendHotwordToggleOn = this.sendHotwordToggleOn.bind(this);
        
        this.startHotword = this.startHotword.bind(this);
        this.stopHotword = this.stopHotword.bind(this);
        this.hotwordCallback = this.hotwordCallback.bind(this)
        let eventFunctions = {
        // SESSION
            'hermod/hotword/toggleOn' : function(payload) {
                if (payload.siteId && payload.siteId.length > 0 && payload.siteId === that.props.siteId) {
                    that.startHotword(that.props.siteId);
                }
            },
            'hermod/hotword/toggleOff' : function(payload) {
                if (payload.siteId && payload.siteId.length > 0 && payload.siteId === that.props.siteId) {
                    that.stopHotword();
                }
            }
        }
        this.logger = this.connectToLogger(props.logger,eventFunctions);
     }  
        
    componentDidMount() {
        let that = this;
         if (this.props.config.hotword.startsWith("browser:")) {
               setTimeout(function() {
                    that.startHotword(that.props.siteId);
               },1000)
         }
    };
    
    componentDidUpdate(props,state) {
      //  console.log(['HW DID UPDATE',props,state,JSON.parse(JSON.stringify(this.props)),this.props.config.hotword + ':' + props.config.hotword]);
        let that = this;
        if (props.inputvolume != this.props.inputvolume) {
            
        }
        if (props.config.hotword != this.props.config.hotword) {
            this.hotwordManager = null;
           // console.log(['RESTART HOTWORD']);
            if (this.props.config.hotword.startsWith("browser:")) {
               setTimeout(function() {
                    that.startHotword(that.props.siteId);
               },1000)
            }
        }
        return false;
        
    };
    
    
    /**
     * Pause the hotword manager
     */ 
    stopHotword() {
        if (this.hotwordManager) this.hotwordManager.pauseProcessing();
    };
    
    /**
     * Create or continue the hotword manager
     */ 
    startHotword(siteId) {
      if (siteId === this.props.siteId ) {
          if (this.hotwordManager === null) {
              //console.log(['REALLY START HOTWORD',this.props.config.hotword]);
              let parts = this.props.config.hotword.split(":");
              if (parts.length > 1) {
                  let localHotword = parts[1];
                  this.hotwordManager =  new PicovoiceAudioManager(this.props.addInputGainNode,this.props.config.inputvolume);
                  let singleSensitivity = this.props.config.hotwordsensitivity ? this.props.config.hotwordsensitivity/100 : 0.9;
                  let sensitivities=new Float32Array([singleSensitivity]);
                  let selectedKeyword = null;
                  if (Resources.keywordIDs.hasOwnProperty(localHotword)) {
                      selectedKeyword = Resources.keywordIDs[localHotword];
                    //  console.log(['SELECTED KW',localHotword,selectedKeyword]);
                      this.hotwordManager.start(Porcupine.create([selectedKeyword], sensitivities), this.hotwordCallback, function(e) {
                        console.log(['HOTWORD error',e]);
                      });
                  }                  
              }
          } else {
              if(this.hotwordManager) this.hotwordManager.continueProcessing();
          }
      }
    };
        
    hotwordCallback(value) {
        if (!isNaN(value) && parseInt(value,10)>=0) {
            this.sendStartSession(this.props.siteId,{startedBy:'Hermodreacthotword',user:this.props.user ? this.props.user._id : ''});
        }
    };
    
        
    render() {
        return <span id="Hermodreacthotwordserver" ></span>
    };
}
