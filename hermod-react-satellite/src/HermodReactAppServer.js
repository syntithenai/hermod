/* global window */
/* global Paho */

import React, { Component } from 'react'
import HermodReactComponent from './HermodReactComponent'

export default class HermodAppServer extends HermodReactComponent {

    constructor(props) {
        super(props);
        let that = this;
        this.state={};
         let eventFunctions = {
        // SESSION
            'hermod/intent/#' : function(payload,message) {
                let thatLogger = this;
                //console.log(['INTENT',this,payload,message]);
                let parts = message.destinationName ? message.destinationName.split("/") : [];
                if (parts.length > 0 && parts[0] === "hermes") {
                    if (parts.length > 1 &&  parts[1] === "intent") {
                        let payload = {};
                        let intent = parts[2];
                        if (intent && intent.length > 0) {
                            try {
                                payload = JSON.parse(message.payloadString);
                                if (that.props.intents && that.props.intents.hasOwnProperty(intent) && that.props.intents[intent]) {
                                    let p = that.props.intents[intent].bind(that)(payload);
                                    if (p && p.then) {
                                        p.then(function(v) {
                                            //console.log(['APP SERVER MESSAGE SUCCESS',intent,payload,v]);
                                            that.sendEndSession.bind(that)(payload.sessionId);
                                        }).catch(function(v) {
                                            //console.log(['APP SERVER MESSAGE REJECT',intent,payload,v]);
                                            that.sendEndSession.bind(that)(payload.sessionId);
                                        });
                                    } else {
                                       //console.log(['APP SERVER MESSAGE SUCCESS no promise',intent,payload,p]);
                                        that.sendEndSession.bind(that)(payload.sessionId);
                                    }
                                    
                                    
                                } else {
                                   //console.log(['APP SERVER MESSAGE no intent',intent,payload]);
                                    that.sendEndSession.bind(that)(payload.sessionId);
                                }
                                
                            } catch (e) {
                                //console.log(['APP SERVER FAILED TO PARSE PAYLOAD',e]);
                                //that.sendEndSession.bind(that)();
                            }                    
                        } else {
                           // that.sendEndSession.bind(that)();
                        }
                    }
                }
                      
            }
        }
        
        this.logger = this.connectToLogger(props.logger,eventFunctions);
     }   
    
    
    cleanSlots(slots) { 
        let final={};
        if (slots) {
            slots.map(function(slot) {
                final[slot.slotName] = {type:slot.value.kind,value:slot.value.value}
                return;
            });
        }
        return final;
    };
       

    render() {
        return <span id="Hermodreactappserver" ></span>
    };
}
