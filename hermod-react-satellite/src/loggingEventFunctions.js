let eventFunctions = {

 /* Hotword */
        'hermod/+/hotword/start':function(topic,siteId,payload) {
            let that = this;
            return new Promise(function(resolve,reject) {
                let hotwordListening = that.state.hotwordListening;
                hotwordListening[siteId] = true;
                that.setState({hotwordListening:hotwordListening});
                that.updateSession(siteId,payload,function(session) {
                        if (session) {
                            session.hotword = true;
                            session.hotwordDetected = false;
                            that.updateSessionStatus(siteId,session);
                        }
                        return session;                        
                });             
                resolve();   
            });
        },
        'hermod/+/hotword/stop':function(topic,siteId,payload) {
            let that = this;
            return new Promise(function(resolve,reject) {
                let hotwordListening = that.state.hotwordListening;
                hotwordListening[siteId] = false;
                that.setState({hotwordListening:hotwordListening});
                that.updateSession(siteId,payload,function(session) {
                    if (session) {
                        session.hotword = false;
                        that.updateSessionStatus(siteId,session);
                    }
                    return session;
                }); 
                resolve() ;
            });
        },
        'hermod/+/hotword/detected':function(topic,siteId,payload) {
            let that = this;
            return new Promise(function(resolve,reject) {
                that.updateSession(siteId,payload,function(session) {
                    if (session) {
                        session.hotwordDetected = true;
                        that.updateSessionStatus(siteId,session);
                    }
                    return session ;
                });
                resolve();
            });
        },
        
        /* NLU */
        'hermod/+/nlu/started':function(topic,siteId,payload) {
           return new Promise(function(resolve,reject) {
               resolve();
            });
        },    
        'hermod/+/nlu/parse':function(topic,siteId,payload) {
           return new Promise(function(resolve,reject) {
               resolve();
            });
        },    
       'hermod/+/nlu/intent': function(topic,siteId,payload) {
            return new Promise(function(resolve,reject) {
               resolve();
            });
        },
        'hermod/+/nlu/fail': function(topic,siteId,payload) {
            return new Promise(function(resolve,reject) {
               resolve();
            });
        },
        'hermod/+/nlu/slot': function(topic,siteId,payload) {
            return new Promise(function(resolve,reject) {
               resolve();
            });
        },
         
        /* TTS */
        'hermod/+/tts/say': function(topic,siteId,payload) {
           let that = this;
           //console.log(['LOG TTS']);
           return new Promise(function(resolve,reject) {
               that.updateSession(siteId,payload,function(session) {
                    if (session) {
                        if (!session.tts) session.tts=[];
                        session.tts.push(payload);
                        that.updateSessionStatus(siteId,session)
                    }
                    return session;
                });
                resolve();
            });
        },
        
        'hermod/+/tts/say/finished': function(topic,siteId,payload) {
            return new Promise(function(resolve,reject) {
               resolve();
            });
        },
        
        'hermod/+/asr/start': function(topic,siteId,payload) {
            let that = this;
            return new Promise(function(resolve,reject) {
                if (payload) {
					that.resetAudioBuffer(siteId);
					let audioListening = that.state.audioListening;
					audioListening[siteId] = true;
					that.setState({audioListening:audioListening})
					that.updateSession(siteId,payload,function(session) {
						if (session && payload) that.updateSessionStatus(siteId,session);
						return session;
					})
				}
                resolve() ;
               // console.log(['START ASR']);
            });
        },
        'hermod/+/asr/stop': function(topic,siteId,payload) {
            let that = this;
            return new Promise(function(resolve,reject) {
                let audioListening = that.state.audioListening;
                audioListening[siteId] = false;
                that.setState({audioListening:audioListening});
                // log audio
                that.updateSession(siteId,payload,function(session) {
                    if (session) {
                        that.logAudioBuffer(payload);
                        that.updateSessionStatus(siteId,session);                        
                    }
                    return session ;
                })
                resolve() ;
            });
        },
        'hermod/+/asr/text': function(topic,siteId,payload) {
            let that = this;
            return new Promise(function(resolve,reject) {
                that.updateSession(siteId,payload,function(session) {
                    if (session) {
                        if (!session.asr) session.asr=[];
                        session.asr.push(payload);
                    }
                   return session ;
                });
                 resolve();
            });
        },
        
        'hermod/+/asr/partial': function(topic,siteId,payload) {
           return new Promise(function(resolve,reject) {
               resolve();
            });
        },

        'hermod/+/dialog/start': function(topic,siteId,payload) {
            return new Promise(function(resolve,reject) {
               resolve();
            });
        },
        'hermod/+/dialog/continue': function(topic,siteId,payload) {
            return new Promise(function(resolve,reject) {
               resolve();
            });
        },
        'hermod/dialog/end': function(topic,siteId,payload) {
            return new Promise(function(resolve,reject) {
               resolve();
            });
        },
        'hermod/+/dialog/started': function(topic,siteId,payload) {
            let that = this;
            return new Promise(function(resolve,reject) {
                that.updateSession(siteId,payload,function(session) {
                    if (session) {
                        session.started = true;
                        session.queued = true;
                        session.starttimestamp =  new Date().getTime()                      
                        session.sessionId = payload.sessionId;
                        session.siteId = siteId;
                        that.updateSessionStatus(siteId,session)  
                        that.lastSessionId[siteId] = payload.sessionId;
                    }
                    return session;
                });
                resolve();
            });
        },
        'hermod/+/dialog/ended': function(topic,siteId,payload) {
            let that = this;
           // console.log(['SESSION ENDED',payload]);
            return new Promise(function(resolve,reject) {
                that.updateSession(siteId,payload,function(session) {
                    if (session) {
                        //if (session.termination && session.termination.reason && session.termination.reason === "nominal") {
                            session.success = true;
                        //}
                        session.ended = true;
                        session.endtimestamp = new Date().getTime()
                        that.updateSessionStatus(siteId,session)
                    }
                    return session;
                });
                resolve();
            });
        },
        'hermod/+/intent':function(topic,siteId,payload) {
            let that = this; 
            return new Promise(function(resolve,reject) {
                that.updateSession(siteId,payload,function(session) {
                    if (session) {
                        if (!session.intents) session.intents=[];
                        session.intents.push(payload);
                        that.updateSessionStatus(siteId,session)
                    }
                    return session;
                });
                resolve();
            });
        }, 
        

        'hermod/+/microphone/audio': function(topic,siteId,payload) {
            return new Promise(function(resolve,reject) {
               resolve();
            });
        }

}

export default eventFunctions;
