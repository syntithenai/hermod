/* global window */

import React from 'react'
import {Component} from 'react'
import eventFunctions from './loggingEventFunctions'
import Crunker from 'crunker'
import HermodMqttServer from './HermodMqttServer'

export default class HermodLogger  extends HermodMqttServer {

    constructor(props) {
        super(props);
        console.log('consstr hermod logger');
        console.log(props);
        this.subscriptions = {};
        this.subscriptionIndex = {};
    
        this.eventFunctions = eventFunctions;
        //this.eventCallbackFunctions = this.addCallbacks(this.props.eventCallbackFunctions);
        this.siteId = props.siteId ? props.siteId :  'site'+parseInt(Math.random()*100000000,10);
        this.state={sites:{},messages:[],session:{},audioListening:{},hotwordListening:{},showLogMessages:{},sessionStatus:{},sessionStatusText:{}};
        this.audioBuffers={};
        this.lastSessionId={};
        this.getSession = this.getSession.bind(this);
        this.saveSession = this.saveSession.bind(this);
        this.updateSession = this.updateSession.bind(this);
        this.logAudioBuffer = this.logAudioBuffer.bind(this);
        this.updateSessionStatus = this.updateSessionStatus.bind(this);
        this.addCallbacks = this.addCallbacks.bind(this);
        this.addSubscription = this.addSubscription.bind(this);
        this.removeSubscription = this.removeSubscription.bind(this);
        this.getSubscription = this.getSubscription.bind(this);
        //this.findEventCallbackFunctions = this.findEventCallbackFunctions.bind(this);
        this.onMessageArrived = this.onMessageArrived.bind(this);
        this.isConnected = this.isConnected.bind(this);
        this.reset = this.reset.bind(this);
        console.log(['LOGGER CONNECT',this.siteId,this.props]);
        this.mqttConnect.bind(this)() ;
    }   
     
     
     
     
    addSubscription(topic,callback,oneOff = false) {
		if (topic && topic.length && typeof callback === "function") {
			let subscriptionId = parseInt(Math.random()*100000000,10);
			// lookup or create
			let topicSubscription = {};
			if (this.subscriptions.hasOwnProperty(topic)) {
				topicSubscription = this.subscriptions[topic]
			console.log('DO ADD SUB '+topic)
				
			} else {
				// real subscription when first created
				console.log('DO SUB '+topic)
				// allow for universal subscription rather than managed per function
				if (!this.props.subscription || this.props.subscription.length === 0) {
					 this.mqttClient.subscribe(topic)
				}
			}
			topicSubscription[subscriptionId] = {oneOff:oneOff,callBack:callback}
			this.subscriptions[topic] = topicSubscription;
			this.subscriptionIndex[subscriptionId] = topic;
			return subscriptionId;
		}
	}
	
	getSubscription(id) {
		if (this.subscriptionIndex.hasOwnProperty(id)) {
			return this.subscriptions[this.subscriptionIndex[id]][id];
		}
	}
	
	removeSubscription(id) {
		let topic = this.subscriptionIndex[id];
		if (topic) {
			delete this.subscriptions[topic][id];
			delete this.subscriptionIndex[id];
		}
		// unsub and cleanup if no more subscriptions on  this topic
		if (Object.keys(this.subscriptions[topic]).length == 0) {
			
			// allow for universal subscription rather than managed per function
			if (!this.props.subscription || this.props.subscription.length === 0) {
				this.mqttClient.unsubscribe(topic);
			}
			delete this.subscriptions[topic];
		}
	}
	
     
     
     
     
    reset() {
        this.setState({sites:{},messages:[],session:{},audioListening:{},hotwordListening:{},showLogMessages:{},sessionStatus:{},sessionStatusText:{} });
        this.audioBuffers={};
        this.lastSessionId={};
    };
    
    addCallbacks(eventCallbackFunctions,oneOff = false) {
		//console.log(['add callbacks',eventCallbackFunctions]);
        let that = this;
        this.eventCallbackFunctions = Array.isArray(this.eventCallbackFunctions) ? this.eventCallbackFunctions : [];
        if (eventCallbackFunctions) {
            Object.keys(eventCallbackFunctions).map(function(key,loopKey) {
                let value = eventCallbackFunctions[key];
                if (typeof value === "function") {
					// console.log(['callback',key,value]);  
					let ikey = key.replace('hermod/+/','hermod/'+that.props.siteId+'/');      
                    that.addSubscription(ikey,value,oneOff)
                    //that.eventCallbackFunctions.push({subscription:key,callBack:value, oneOff: oneOff,id:parseInt(Math.random()*100000000,10)});
                }
            });
        }
       // return this.eventCallbackFunctions;
    };
    
    //findEventCallbackFunctions(subscriptionKey) {
        //let that = this;
        //let ret=[];
        //this.eventCallbackFunctions.map(function(value,vkey) {
            //if (that.mqttWildcard(subscriptionKey,value.subscription)) {
                //ret.push(value);
                //return;
            //}
        //});
        //return ret;
    //};
    
  					  
    mqttWildcard(topic, wildcard) {
        if (topic === wildcard) {
            return [];
        } else if (wildcard === '#') {
            return [topic];
        }

        var res = [];

        var t = String(topic).split('/');
        var w = String(wildcard).split('/');

        var i = 0;
        for (var lt = t.length; i < lt; i++) {
            if (w[i] === '+') {
                res.push(t[i]);
            } else if (w[i] === '#') {
                res.push(t.slice(i).join('/'));
                return res;
            } else if (w[i] !== t[i]) {
                return null;
            }
        }

        if (w[i] === '#') {
            i += 1;
        }

        return (i === w.length) ? res : null;
    }
    
    generateUuid() {
        //// return uuid of form xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
        var uuid = '', ii;
        for (ii = 0; ii < 32; ii += 1) {
          switch (ii) {
          case 8:
          case 20:
            uuid += '-';
            uuid += (Math.random() * 16 | 0).toString(16);
            break;
          case 12:
            uuid += '-';
            uuid += '4';
            break;
          case 16:
            uuid += '-';
            uuid += (Math.random() * 4 | 8).toString(16);
            break;
          default:
            uuid += (Math.random() * 16 | 0).toString(16);
          }
        }
        return uuid;
    };
    
    onMessageArrived(topic,message) {
		//console.log(['ONMESSAGEARRIVED',topic,message]);
		message.destinationName = topic;
		message.payloadBytes = message;
		message.payloadString = String(message)
        let that = this;
        let parts = message.destinationName ? message.destinationName.split("/") : [];
		if (parts.length > 1 && parts[0] === "hermod") {
			let siteId = parts[1];
			let payload = {};
			// special handling where the payload is audio
            if (parts.length > 3 && ((parts[2]==="speaker"&& parts[3]==="play"  ) || (parts[2]==="microphone" && parts[3]==="audio"  )) ) {
				var session = null;
				payload = message;
				if (parts[2] === "microphone") {
					//this.appendAudioBuffer(siteId,payload);
				}
			//// Non Audio Messages parse JSON body
			} else {
			//	console.log(['amessage',message.destinationName,this.state]);
                try {
                  payload = JSON.parse(message.payloadString);  
                } catch (e) {
                }
                // log plain flat messages
				let messages = this.state.messages;
				let  thisState = this.getSession(siteId,payload.id);
				if (!thisState) thisState= {};
				if (payload.id) this.lastSessionId[siteId] = payload.id;
				messages.push({id:thisState.id,payload: <div style={{backgroundColor:'lightgrey'}}><hr/><div style={{backgroundColor:'lightblue'}}><pre>{JSON.stringify(payload,undefined,4)}</pre></div><hr/><div style={{backgroundColor:'lightgreen'}}><pre>{JSON.stringify(thisState,undefined,4)}</pre></div><hr/></div>  ,text:message.destinationName});
				this.setState({messages:messages});                        
				//console.log(['logged messages',messages]);
			}
			if (!payload) payload = {};
			
			let functionKey = message.destinationName;
			//console.log(['payload ',payload,this.subscriptions,this.subscriptionIndex]);
			let session = that.getSession(siteId,payload ? payload.id : null);
						
			function runServiceCallbacks(functionKey) {
				let callbacks = that.subscriptions[functionKey]
				if (callbacks) {
					for (var ckey in callbacks) {
						let value = callbacks[ckey];
					//	console.log(['RUN SERVICE CALLBACK',value,ckey,message.destinationName,siteId,payload])
						value.callBack.bind(that)(message.destinationName,siteId,payload);
					}
				}	
			}
			//// logging callbacks
			//let matchingEventFunction = null
			//for (var i in this.eventFunctions) {
				//if (this.mqttWildcard(functionKey,i)) {
					//matchingEventFunction = this.eventFunctions[i];
					//break;
				//}
			//}
			
			//if (matchingEventFunction) {
				//let p = matchingEventFunction.bind(that)(message.destinationName,siteId,payload);
				//p.then(function(session) {
					//runServiceCallbacks(functionKey);
				//}).catch(function(e) {
					//console.log(e);
				//});
			//} else {
				//console.log('runServiceCallbacks',functionKey)	
				runServiceCallbacks(functionKey);
				//console.log('ranServiceCallbacks',functionKey)	

			//}

		   
		}
		   
    };
 
   
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
  
    /** 
     * Get a session for a given siteId and sessionId
     * 
     */  
   //  that.lastSessionId[payload.siteId]
    getSession(siteIdIn,sessionIdIn) {
       // console.log(['getSession(',siteIdIn,sessionIdIn])
        let siteId = null;
        let sessionId = null;
        let that = this;
        
        function findOrCreateSession(siteId,sessionId) {
			sessionId = String(sessionId)
           // console.log(['findOrCreateSession',siteId,sessionId])
            if (siteId && siteId.length > 0 && sessionId && sessionId.length > 0) {
                if (that.state.sites && that.state.sites.hasOwnProperty(siteId) && that.state.sites[siteId].hasOwnProperty(sessionId) && that.state.sites[siteId][sessionId]) {
                    return that.state.sites[siteId][sessionId];
                } else {
                    // fallback, create a new session
                    let sites = that.state.sites ? that.state.sites : {};
                    let sessions = that.state.sessions ? that.state.sessions : {};
                    if (!sites.hasOwnProperty(siteId)) sites[siteId] = {};
                    let newSession={createtimestamp: new Date().getTime(),siteId:siteId,id:sessionId};
                    if (!sites[siteId].hasOwnProperty(sessionId)) sites[siteId][sessionId]=newSession;
                    sessions[sessionId] = siteId;
                    that.setState({sites:sites,sessions:sessions});
                    return sites[siteId][sessionId];
                }                
            } else {
                console.log(['CANNOT FIND OR CREATE SESSION MISSING SITE ID',siteId,sessionId]);
				return null;
            }
        };
        
        if (siteIdIn && siteIdIn.length>0) {
            if (sessionIdIn && sessionIdIn.length>0) {
                // have site and session id
                siteId = siteIdIn;
                sessionId = sessionIdIn;
				return findOrCreateSession(siteId,sessionId);
            } else {
                // have siteId
                siteId = siteIdIn;
                sessionId = this.lastSessionId[siteId];
				//console.log(['session id from lastSessionId',this.lastSessionId,siteId])
				return findOrCreateSession(siteId,sessionId);
            }
        } else {
			console.log('MISSING SITE ID IN LOGGER')
		}
        
    }; 

    
    /**
     *  Lookup session, use callback to make changes and restore session to state
     */
    updateSession(siteId,payload,callback) {
        
        let sessionId = payload && payload.id && payload.id.length > 0 ? payload.id : null;
        let session = this.getSession(siteId,sessionId);
        if (session) {
            let result = callback(session)
            this.saveSession(session.siteId,session.id,result);                    
        }          
    };
   
    
    saveSession(siteId,sessionIdIn,session) {
         let sessionId =  sessionIdIn && sessionIdIn.length > 0 ? sessionIdIn : 'unknownSession';
        // ensure siteId
        //let siteId=siteIdIn;
        //if (!siteIdIn ||siteIdIn.length === 0) {
            //siteId = this.state.sessions[sessionId];
        //}        
        if (siteId && siteId.length>0) {
            let sites = this.state.sites;
            sites[siteId][sessionId] = session;
            this.setState({sites:sites});
            this.setLogData();
        }
        
    };

	// push log data up to parent component
    setLogData() {
        if (this.props.setLogData)  this.props.setLogData(this.state.sites,this.state.messages,this.state.sessionStatus,this.state.sessionStatusText,this.state.hotwordListening,this.state.audioListening);
    };   

   
    
    updateSessionStatus(siteKey,session) {
        let that = this;
         let sessionStatus=0;
        let sessionKey = session.sessionId;
        if (that.state.hotwordListening[siteKey]) sessionStatus=1;
        if (that.state.audioListening[siteKey]) sessionStatus=2;
        if (session.queued) sessionStatus=3;
        if (session.started) sessionStatus=4;
        if (session.intents && session.asr && session.intents.length < session.asr.length) sessionStatus=5;
        if (session.intents && session.asr && session.intents.length === session.asr.length) sessionStatus=6;
        if (session.ended) sessionStatus=7;
        if (session.success) sessionStatus=8;
        let statusTexts=['starting','hotword','listening','queued','started','transcribed','interpreted','ended','success'];
        let statusText= statusTexts[sessionStatus];
        let allSessionsStatus = that.state.sessionStatus;
        let allSessionsStatusText = that.state.sessionStatusText;
        allSessionsStatus[sessionKey] = sessionStatus;
        allSessionsStatusText[sessionKey] = statusText;
        that.setState({sessionStatus:allSessionsStatus,sessionStatusText:allSessionsStatusText});
    }; 
 
  
    /**
     * Get or create an audio buffer for the siteId
     */
    getAudioBuffer(siteId) {
        if (siteId) {
            if (this.audioBuffers.hasOwnProperty(siteId)) {
                return this.audioBuffers[siteId];
            } else {
                this.audioBuffers[siteId] = [];
                return this.audioBuffers[siteId];
            }
        }
    };
    
    /**
     * Get or create an audio buffer for the siteId
     */
    appendAudioBuffer(siteId,buffer) {
        
        if (this.props.logAudio === true && siteId) {
            if (this.state.audioListening[siteId]) {
                let currentBuffer = this.getAudioBuffer(siteId);
                currentBuffer.push(buffer);
            }
        }
    };


    /**
     * Get or create an audio buffer for the siteId
     */
    resetAudioBuffer(siteId) {
        this.audioBuffers[siteId] = [];
    };
    
    logAudioBuffer(payload) {
        let that = this;
        let promises = [];
        let siteId = payload.siteId;
                
        if (this.props.logAudio === true) {
            try {
                // save to sites/sessions
                let audioContext = window.AudioContext || window.webkitAudioContext;
                let context = new audioContext();
                let audioBuffer = this.getAudioBuffer(siteId);
                // memory overload protection
              // if (audioBuffer.length> 350) return;
                audioBuffer.map(function(bytes,key) {
                    let p = new Promise(function(resolve,reject) {
                        if (bytes && bytes.length > 0) {
                            var buffer = new Uint8Array( bytes.length );
							buffer.set( new Uint8Array(bytes), 0 );
                            try {
                                context.decodeAudioData(buffer.buffer, function(audioBuffer) {
                                    resolve(audioBuffer);
                                });
                            } catch (e) {
                                // trash buffer
                                reject();
                            }   
                        }
                    });
                   promises.push(p);
                    return;
                })
            } catch (e) {
                console.log(['ERROR',e]);
            }
                
            Promise.all(promises).then(function(allBuffers) {
                let merger =  new Crunker();
                try {
                    let output = merger.export(merger.concatAudio(allBuffers), "audio/wav");
                    that.updateSession(siteId,payload,function(session) {
                             if (!session.audio) session.audio=[];
                             that.blobToDataUrl(output.blob).then(function(dataUrl) {
                                session.audio.push(dataUrl);               
                                // start again
                                that.resetAudioBuffer(siteId); 
                                that.setLogData();
                             });                         
                             return session;
                    });                
                } catch (e) {
                    console.log(e.message);
                }
            });            
        }
    };
    
    blobToDataUrl(blob) {
        return new Promise((fulfill, reject) => {
            let reader = new FileReader();
            reader.onerror = reject;
            reader.onload = (e) => fulfill(reader.result);
            reader.readAsDataURL(blob);
        })
    }
    
    sendMqtt(destination,payload) {
       // console.log(['SEND MQTT',this.state.connected,destination,payload]);
       //if (!destination.startsWith('hermod/audioServer')) console.log(['SESSION SEND MQTT LOGGER',destination,payload])
        if (this.state.connected) {
            //let message = new Paho.MQTT.Message(JSON.stringify(payload));
            //message.destinationName = destination;
            this.mqttClient.publish(destination,JSON.stringify(payload));
            
        }
    };
    sendAudioMqtt(destination,payload) {
        //console.log('SENDAUDIOMQTT '+destination);
           if (this.state.connected) {
        //   console.log('SENDAUDIOMQTT '+destination);
            this.mqttClient.publish(destination,payload);//Buffer.from(
            //let message = new Paho.MQTT.Message(payload);
            //message.destinationName = destination;
            //this.mqttClient.send(message);
            
        }
    };
    
    /**
     * Send Mqtt message to speak text
     */ 
    say(siteId,text) {
        let that = this;
        //console.log(['SAY',this.state.connected,destination,payload]);
        if (that.state && that.state.connected) {
            let payload = {text:text};
            this.mqttClient.publish('hermod/'+siteId+'/tts/say',JSON.stringify(payload));
            //let message = new Paho.MQTT.Message(JSON.stringify(payload));
            //message.destinationName = "hermod/tts/say";
            //that.mqttClient.send(message);
            
        }
    };
    
    isConnected() {
        return this.state.connected;
    };


}
