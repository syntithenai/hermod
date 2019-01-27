let eventFunctions = {

 /* Hotword */
        'hermod/hotword/toggleOn':function(payload) {
            let that = this;
            return new Promise(function(resolve,reject) {
                let hotwordListening = that.state.hotwordListening;
                hotwordListening[payload.siteId] = true;
                that.setState({hotwordListening:hotwordListening});
                that.updateSession(payload,function(session) {
                        if (session) {
                            session.hotword = true;
                            session.hotwordDetected = false;
                            that.updateSessionStatus(payload.siteId,session);
                        }
                        return session;                        
                });             
                resolve();   
            });
        },
        'hermod/hotword/toggleOff':function(payload) {
            let that = this;
            return new Promise(function(resolve,reject) {
                let hotwordListening = that.state.hotwordListening;
                hotwordListening[payload.siteId] = false;
                that.setState({hotwordListening:hotwordListening});
                that.updateSession(payload,function(session) {
                    if (session) {
                        session.hotword = false;
                        that.updateSessionStatus(payload.siteId,session);
                    }
                    return session;
                });
                resolve() ;
            });
        },
        'hermod/hotword/#/detected':function(payload) {
            let that = this;
            return new Promise(function(resolve,reject) {
                that.updateSession(payload,function(session) {
                    if (session) {
                        session.hotwordDetected = true;
                        that.updateSessionStatus(payload.siteId,session);
                    }
                    return session ;
                });
                resolve();
            });
        },
        
        /* NLU */
        'hermod/nlu/query':function(payload) {
           return new Promise(function(resolve,reject) {
               resolve();
            });
        },    
        'hermod/nlu/partialQuery':function(payload) {
            return new Promise(function(resolve,reject) {
               resolve();
            });
        },
        'hermod/nlu/intentParsed': function(payload) {
            return new Promise(function(resolve,reject) {
               resolve();
            });
        },
        'hermod/nlu/intentNotRecognized': function(payload) {
            return new Promise(function(resolve,reject) {
               resolve();
            });
        },
        'hermod/nlu/slotParsed': function(payload) {
            return new Promise(function(resolve,reject) {
               resolve();
            });
        },
        'hermod/error/nlu': function(payload) {
            return new Promise(function(resolve,reject) {
               resolve();
            });
        },
        
        /* TTS */
        'hermod/tts/say': function(payload) {
           let that = this;
           return new Promise(function(resolve,reject) {
               that.updateSession(payload,function(session) {
                    if (session) {
                        if (!session.tts) session.tts=[];
                        session.tts.push(payload);
                        that.updateSessionStatus(payload.siteId,session)
                    }
                    return session;
                });
                resolve();
            });
        },
        
        'hermod/tts/sayFinished': function(payload) {
            return new Promise(function(resolve,reject) {
               resolve();
            });
        },
        
        'hermod/asr/toggleOn': function(payload) {
            return new Promise(function(resolve,reject) {
               resolve();
            });
        },
        'hermod/asr/toggleOff': function(payload) {
            return new Promise(function(resolve,reject) {
               resolve();
            });
        },
        'hermod/asr/startListening': function(payload) {
            let that = this;
            return new Promise(function(resolve,reject) {
                that.resetAudioBuffer(payload.siteId);
                let audioListening = that.state.audioListening;
                audioListening[payload.siteId] = true;
                that.setState({audioListening:audioListening})
                that.updateSession(payload,function(session) {
                    if (session && payload) that.updateSessionStatus(payload.siteId,session);
                    return session;
                })
                resolve() ;
            });
        },
        'hermod/asr/stopListening': function(payload) {
            let that = this;
            return new Promise(function(resolve,reject) {
                let audioListening = that.state.audioListening;
                audioListening[payload.siteId] = false;
                that.setState({audioListening:audioListening});
                // log audio
                that.updateSession(payload,function(session) {
                    if (session) {
                        that.logAudioBuffer(payload);
                        that.updateSessionStatus(payload.siteId,session);                        
                    }
                    return session ;
                })
                resolve() ;
            });
        },
        'hermod/asr/textCaptured': function(payload) {
            let that = this;
            return new Promise(function(resolve,reject) {
                that.updateSession(payload,function(session) {
                    if (session) {
                        if (!session.asr) session.asr=[];
                        session.asr.push(payload);
                    }
                   return session ;
                });
                 resolve();
            });
        },
        
        'hermod/asr/partialTextCaptured': function(payload) {
           return new Promise(function(resolve,reject) {
               resolve();
            });
        },

        'hermod/dialogueManager/startSession': function(payload) {
            return new Promise(function(resolve,reject) {
               resolve();
            });
        },
        'hermod/dialogueManager/continueSession': function(payload) {
            return new Promise(function(resolve,reject) {
               resolve();
            });
        },
        'hermod/dialogueManager/endSession': function(payload) {
            return new Promise(function(resolve,reject) {
               resolve();
            });
        },
        'hermod/dialogueManager/sessionStarted': function(payload) {
            let that = this;
            return new Promise(function(resolve,reject) {
                that.updateSession(payload,function(session) {
                    if (session) {
                        session.started = true;
                        session.queued = true;
                        session.starttimestamp =  new Date().getTime()                      
                        session.sessionId = payload.sessionId;
                        session.siteId = payload.siteId;
                        that.updateSessionStatus(payload.siteId,session)  
                        that.lastSessionId[payload.siteId] = payload.sessionId;
                    }
                    return session;
                });
                resolve();
            });
        },
        'hermod/dialogueManager/sessionEnded': function(payload) {
            let that = this;
            return new Promise(function(resolve,reject) {
                that.updateSession(payload,function(session) {
                    if (session) {
                        if (session.termination && session.termination.reason && session.termination.reason === "nominal") {
                            session.success = true;
                        }
                        session.ended = true;
                        session.endtimestamp = new Date().getTime()
                        that.updateSessionStatus(payload.siteId,session)
                    }
                    return session;
                });
                resolve();
            });
        },
        'hermod/dialogueManager/sessionQueued': function(payload) {
            let that = this;
            return new Promise(function(resolve,reject) {
                that.updateSession(payload,function(session) {
                    if (session) {
                        session.queued = true;
                        session.queuedtimestamp = new Date().getTime()
                        that.updateSessionStatus(payload.siteId,session)                        
                    }
                    return session;
                });
                resolve();
            });
        },
        'hermod/intent/#':function(payload) {
            let that = this; 
            return new Promise(function(resolve,reject) {
                that.updateSession(payload,function(session) {
                    if (session) {
                        if (!session.intents) session.intents=[];
                        session.intents.push(payload);
                        that.updateSessionStatus(payload.siteId,session)
                    }
                    return session;
                });
                resolve();
            });
        }, 
        

        /* Feedback *
         */
        'hermod/feedback/sound/toggleOn': function(payload) {
            return new Promise(function(resolve,reject) {
               resolve();
            });
        },
        'hermod/feedback/sound/toggleOff': function(payload) {
            return new Promise(function(resolve,reject) {
               resolve();
            });
        },
        'hermod/audioServer/#/playBytes': function(payload) {
            return new Promise(function(resolve,reject) {
               resolve();
            });
        },
        'hermod/audioServer/#/playFinished': function(payload) {
            return new Promise(function(resolve,reject) {
               resolve();
            });
        },
        'hermod/audioServer/#/audioFrame': function(payload) {
            return new Promise(function(resolve,reject) {
               resolve();
            });
        }

}

module.exports= eventFunctions;
