var eventFunctions = {}; //require('./eventFunctions')

var HermodMqttServer = require('./HermodMqttServer')

class HermodLogger  extends HermodMqttServer {
    constructor(props) {
        super(props);
        this.eventFunctions = eventFunctions;
        this.eventCallbackFunctions = this.addCallbacks(this.props.eventCallbackFunctions);
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
        this.findEventCallbackFunctions = this.findEventCallbackFunctions.bind(this);
        this.onMessageArrived = this.onMessageArrived.bind(this);
        this.isConnected = this.isConnected.bind(this);
        this.reset = this.reset.bind(this);
        this.mqttConnect.bind(this)() ;
    }   
     
    reset() {
        this.setState({sites:{},messages:[],session:{},audioListening:{},hotwordListening:{},showLogMessages:{},sessionStatus:{},sessionStatusText:{} });
        this.audioBuffers={};
        this.lastSessionId={};
    };
    
    addCallbacks(eventCallbackFunctions,oneOff = false) {
        let that = this;
        this.eventCallbackFunctions = Array.isArray(this.eventCallbackFunctions) ? this.eventCallbackFunctions : [];
        if (eventCallbackFunctions) {
            Object.keys(eventCallbackFunctions).map(function(key,loopKey) {
                let value = eventCallbackFunctions[key];
                if (typeof value === "function") {
                    that.eventCallbackFunctions.push({subscription:key,callBack:value, oneOff: oneOff,id:parseInt(Math.random()*100000000,10)});
                }
            });
        }
        return this.eventCallbackFunctions;
    };
    
    findEventCallbackFunctions(subscriptionKey) {
        let that = this;
        let ret=[];
        this.eventCallbackFunctions.map(function(value,vkey) {
            if (value.subscription === subscriptionKey) {
                ret.push(value);
                return;
            }
        });
        return ret;
    };
    
      
   
    
    onMessageArrived(topic,message) {
		let that = this;
        let parts = topic ? topic.split("/") : [];
        if (parts.length > 0 && parts[0] === "hermod") {
               // Audio 
            if (parts.length > 2 && (parts[2]==="microphone" || parts[2]==="speaker")) {
                let siteId = parts[1];
                    
                var audio = message;
                if (parts.length > 3) {
                    let action = parts[3];
                    let id = parts.length > 4 ? parts[4] : ''; //this.generateUuid() ;
                    if (action === "play") {
                    } else if (action === "playFinished") {
                    } else if (action === "audioFrame") {
                        this.appendAudioBuffer(siteId,audio);
                    }   
                    let functionKey ='hermod/#/'+parts[2]+'/'+action;
                    function runServiceCallbacks(functionKey) {
						let callbacks = that.findEventCallbackFunctions(functionKey);
						if (callbacks) {
							callbacks.map(function(value,ckey) {
								let session = that.getSession(siteId,null);
								value.callBack.bind(that)(message.destinationName,siteId,id,session,audio);
							});
						}	
					}
					if (this.eventFunctions.hasOwnProperty(functionKey)) {
                        let p = that.eventFunctions[functionKey].bind(that)(audio);
                        p.then(function(session) {
                            runServiceCallbacks(functionKey);
                        }).catch(function(e) {
                            console.log(e);
                        });
                    } else {
						runServiceCallbacks(functionKey);	
					}
                    let sessionId = this.lastSessionId[siteId];
                     

                    let messages = this.state.messages;
                    if (action !== "audioFrame" && (!this.props.siteId || (this.props.siteId && this.props.siteId === siteId ))) {
                        messages.push({sessionId:sessionId,payload: "<div style={{backgroundColor:'lightgrey'}}><hr/></div>"  ,text:message.destinationName});
                        this.setState({messages:messages});                        
                    }
                } 
            // Non Audio Messages
            } else {
				let payload = {};
                try {
                  //payload = JSON.parse(message.payloadString);
                  payload = JSON.parse(message);  
                } catch (e) {
                }
                    // replace siteId in incoming topic
                    let parts = topic.split("/");
                    parts[1] = "#"
                    let functionKey = parts.join("/")
					// event functions update log data structures
                    function runServiceCallbacks() {
						// now process any events attached to topics by services
						let callbacks = that.findEventCallbackFunctions(functionKey);
						if (callbacks) {
							callbacks.map(function(value,ckey) {
								value.callBack.bind(that)(payload,message);
								if (value.oneOff) {
									// remove this callback
									let breakLoop = false;
									that.eventCallbackFunctions.map(function(tvalue,vkey) {
										if (value.id === tvalue.id && !breakLoop) {
											that.eventCallbackFunctions.splice(vkey,1);
											breakLoop = true;
										}
										return;
									});
								}
							});
						}
					}
					// logging action first, then service callback
					if (this.eventFunctions.hasOwnProperty(functionKey)) {
						let p = that.eventFunctions[functionKey].bind(that)(payload);
                        p.then(function() {runServiceCallbacks()}).catch(function(e) {
							console.log(e);
						});
					// no logging, just service callback
					} else {
						runServiceCallbacks()
					}

                        
                   //let thisState = {}
                        //if (payload.siteId) {
                        //if (payload.sessionId) {
                            //thisState = this.getSession(payload.siteId,payload.sessionId);
                        //}
                    //}
                   //  let messages = this.state.messages;
                       //messages.push({sessionId:thisState.sessionId,payload: "<div style={{backgroundColor:'lightgrey'}}><hr/><div style={{backgroundColor:'lightblue'}}><pre>{JSON.stringify(payload,undefined,4)}</pre></div><hr/><div style={{backgroundColor:'lightgreen'}}><pre>{JSON.stringify(thisState,undefined,4)}</pre></div><hr/></div>"  ,text:message.destinationName});
                        //this.setState({messages:messages});                        
                    
                   // console.log(['LOGGER MESSAGE',message.destinationName,message,JSON.parse(JSON.stringify(this.state.sites))]);
               
            } 
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
        let siteId = null;
        let sessionId = null;
        let that = this;
        
        function findOrCreateSession(siteId,sessionId) {
            if (siteId && siteId.length > 0 && sessionId && sessionId.length > 0) {
                if (that.state.sites && that.state.sites.hasOwnProperty(siteId) && that.state.sites[siteId].hasOwnProperty(sessionId) && that.state.sites[siteId][sessionId]) {
                    return that.state.sites[siteId][sessionId];
                } else {
                    // fallback, create a new session
                    let sites = that.state.sites ? that.state.sites : {};
                    let sessions = that.state.sessions ? that.state.sessions : {};
                    if (!sites.hasOwnProperty(siteId)) sites[siteId] = {};
                    let newSession={createtimestamp: new Date().getTime(),siteId:siteId,sessionId:sessionId};
                    if (!sites[siteId].hasOwnProperty(sessionId)) sites[siteId][sessionId]=newSession;
                    sessions[sessionId] = siteId;
                    that.setState({sites:sites,sessions:sessions});
                    return sites[siteId][sessionId];
                }                
            } else {
                console.log(['CANNOT FIND OR CREATE SESSION MISSING SITE OR SESSION ID',siteId,sessionId]);
            }
        };
        
        if (siteIdIn && siteIdIn.length>0) {
            if (sessionIdIn && sessionIdIn.length>0) {
                // have site and session id
                siteId = siteIdIn;
                sessionId = sessionIdIn;
            } else {
                // have siteId
                siteId = siteIdIn;
                sessionId = this.lastSessionId[siteId];
            }
        } else {
            if (sessionIdIn && sessionIdIn.length>0) {
                // have sessionId
                sessionId = sessionIdIn;
                siteId = this.state.sessions[sessionId];
            } else {
                // have no ids
                console.log(['FAILED TO CAPTURE MESSAGE WITH NO SITE OR SESSION ID']);
                return null;
            }
        }
        return findOrCreateSession(siteId,sessionId);
        
    }; 

    
    /**
     *  Lookup session, use callback to make changes and restore session to state
     */
    updateSession(payload,callback) {
        let siteId = payload && payload.siteId && payload.siteId.length > 0 ? payload.siteId : null;
        
        let sessionId = payload && payload.sessionId && payload.sessionId.length > 0 ? payload.sessionId : null;
        let session = this.getSession(siteId,sessionId);
        if (session) {
            let result = callback(session)
            this.saveSession(session.siteId,session.sessionId,result);                    
        }          
    }
   
    
    saveSession(siteIdIn,sessionIdIn,session) {
         let sessionId =  sessionIdIn && sessionIdIn.length > 0 ? sessionIdIn : 'unknownSession';
        // ensure siteId
        let siteId=
                        
                   //let thisState = {}
                        //if (payload.siteId) {
                   
                        
                   //let thisState = {}
                        //if (payload.siteId) {
                        //if (payload.sessionId) {
                            //thisState = this.getSession(payload.siteId,payload.sessionId);
                        //}
                    //}
                   //  let messages = this.state.messages;
                       //messages.push({sessionId:thisState.sessionId,payload: "<div style={{backgroundColor:'lightgrey'}}><hr/><div style={{backgroundColor:'lightblue'}}><pre>{JSON.stringify(payload,undefined,4)}</pre></div><hr/><div style={{backgroundColor:'lightgreen'}}><pre>{JSON.stringify(thisState,undefined,4)}</pre></div><hr/></div>"  ,text:message.destinationName});
                        //this.setState({messages:messages});                        
                    
                   // console.log(['LOGGER MESSAGE',message.destinationName,message,JSON.parse(JSON.stringify(this.state.sites))]);
                    //if (payload.sessionId) {
                            //thisState = this.getSession(payload.siteId,payload.sessionId);
                        //}
                    //}
                   //  let messages = this.state.messages;
                       //messages.push({sessionId:thisState.sessionId,payload: "<div style={{backgroundColor:'lightgrey'}}><hr/><div style={{backgroundColor:'lightblue'}}><pre>{JSON.stringify(payload,undefined,4)}</pre></div><hr/><div style={{backgroundColor:'lightgreen'}}><pre>{JSON.stringify(thisState,undefined,4)}</pre></div><hr/></div>"  ,text:message.destinationName});
                        //this.setState({messages:messages});                        
                    
                   // console.log(['LOGGER MESSAGE',message.destinationName,message,JSON.parse(JSON.stringify(this.state.sites))]);
               siteIdIn;
        if (!siteIdIn ||siteIdIn.length === 0) {
            siteId = this.state.sessions[sessionId];
        }        
        if (siteId && siteId.length>0) {
            let sites = this.state.sites;
            sites[siteId][sessionId] = session;
            this.setState({sites:sites});
            this.setLogData();
        }
        
    };

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
                        var buffer = new Uint8Array( bytes.length );
                        if (bytes.length > 0) {
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
                    that.updateSession(payload,function(session) {
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

    isConnected() {
        return this.state.connected;
    };


}
module.exports = HermodLogger
 //generateUuid() {
        ////// return uuid of form xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
        //var uuid = '', ii;
        //for (ii = 0; ii < 32; ii += 1) {
          //switch (ii) {
          //case 8:
          //case 20:
            //uuid += '-';
            //uuid += (Math.random() * 16 | 0).toString(16);
            //break;
          //case 12:
            //uuid += '-';
            //uuid += '4';
            //break;
          //case 16:
            //uuid += '-';
            //uuid += (Math.random() * 4 | 8).toString(16);
            //break;
          //default:
            //uuid += (Math.random() * 16 | 0).toString(16);
          //}
        //}
        //return uuid;
    //};
