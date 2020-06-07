/* global window */

//var Porcupine = require('./porcupine/porcupine')
var PorcupineManager = require('./porcupine/porcupine_manager')
var WebVoiceProcessor = require('./porcupine/web_voice_processor')
var KeywordData =  require('./porcupine/keyword_data')
//var PorcupineWorker =  require('./porcupine/porcupine_worker')
//var DownsampleWorker =  require('./porcupine/downsampling_worker')
//var PorcupineModule =  require('./porcupine/pv_porcupine')

//console.log('MODULE')
//console.log(PorcupineModule())
const Analytics = require('analytics-node');
 
const analyticsClient = new Analytics('UA-3712973-3');

function logAnalyticsEvent(name,user) {
    analyticsClient.track({
      event: name,
      userId: user
    });
}

try {
    window.PorcupineManager = PorcupineManager
    window.WebVoiceProcessor = WebVoiceProcessor
    //window.KeywordData = KeywordData
    //window.PorcupineModule = PorcupineModule()
    //window.PorcupineWorker = PorcupineWorker
    //window.DownsampleWorker = DownsampleWorker
} catch(e) {}
 

//var Module = require('./pv_porcupine')
   
var hark = require('hark');
var getUserMedia = require('getusermedia')  
var mqtt = require('mqtt')
//var mqtt = require('./mqttws31.min.js')
//console.log('MQTT')
//console.log(mqtt)
var wav2mqtt = require('./wav2mqtt')
//var Porcupine = require('./porcupine')  
//var PicovoiceAudioManager = require('./picovoiceAudioManager')


var HermodWebClient = function(config) {
        
        var mqttClient = null;
        var isRecording = false;
        var isSending = false;
        var isPlaying = false;
        var waitingFor = {}
        var onCallbacks = {}
        var hotwordManager = null;
        var hotwordInitialised = false;
        var hotwordStarted = false;
        var inputvolume = 1.0  // TODO also hotword volume?
        var outputvolume = 1.0
        var site = null;
        var inputGainNodes=[];
        var gainNode=null;
        
        var porcupineManager;
        var speakingTimeout = null;     
        var speaking = false;
        var microphoneAudioBuffer = []
        var bufferSource = null;
        var currentVolume = null;
        var speakerCache = []
        var SENSITIVITIES = new Float32Array([
                0.9 //, // "Hey Edison"
                //0.5, // "Hot Pink"
                //0.5, // "Deep Pink"
                //0.5, // "Fire Brick"
                //0.5, // "Papaya Whip"
                //0.5, // "Peach Puff"
                //0.5, // "Sandy Brown"
                //0.5, // "Lime Green"
                //0.5, // "Forest Green"
                //0.5, // "Midnight Blue"
                //0.5, // "Magenta"
                //0.5, // "White Smoke"
                //0.5, // "Lavender Blush"
                //0.5 // "Dim Gray"
            ]);
        
        
        
        
        var messageFunctions = {
            // SPEAKER
             //elif topic.startswith('hermod/' + self.site + '/speaker/cache'):
            ////self.log('CACHE PLAYING')
            //// limit length of direct audio, alt use url streaming for unlimited
            //if len(self.speaker_cache) < 800:
                //self.speaker_cache.append(msg.payload)
                
            'hermod/+/speaker/cache/+' : function(topic,site,payload) {
                console.log(['speaker cache',speakerCache.length,payload]);
                if (speakerCache.length < 200) {
                    speakerCache.push(payload)
                }
            }, 
            'hermod/+/speaker/play/+' : function(topic,site,payload) {
                console.log(['speaker play',site,payload]);
                var parts = topic.split("/")
                var uid = 'no_id'
                if (parts.length > 4)  {
                    uid = parts[4]
                }
                if (site && site.length > 0) { 
                    mqttClient.publish("hermod/"+site+"/speaker/started",JSON.stringify({"id":uid})); 
					console.log(['START speaker play']);
                    speakerCache.push(payload)
                    playSound(concat_arrays(speakerCache)).then(function() {
                        console.log(['DONE speaker play']);
                        speakerCache = []
                        mqttClient.publish("hermod/"+site+"/speaker/finished",JSON.stringify({"id":uid})); 
					}); 
                }
            }, 
            'hermod/+/nlu/intent': function(topic,site,payload) {
                 logAnalyticsEvent(JSON.stringify(payload),site)
 
            },
            'hermod/+/asr/start': function(topic,site,payload) {
                // quarter volume for 10 seconds
                muteVolume()
            },
            'hermod/+/tts/say': function(topic,site,payload) {
               isPlaying = true 
            }, 
            'hermod/+/tts/finished': function(topic,site,payload) {
               isPlaying = false 
            }, 
            'hermod/+/asr/stop': function(topic,site,payload) {
                // quarter volume for 10 seconds
                console.log('stop message unmute')
                unmuteVolume()
            } ,
            'hermod/+/speaker/volume': function(topic,site,payloadIn) {
                // quarter volume for 10 seconds
                payload = {}
                try {
                    payload = JSON.parse(payloadIn)
                    if (payload.volume) setVolume(payload.volume)
                } catch(e) {
                    
                }
            } , 
            
            //'hermod/+/microphone/start' : function(topic,site,payload) {
                //startMicrophone()
            //},
            //'hermod/+/microphone/stop' : function(topic,site,payload) {
                //stopMicrophone()
            //},
            'hermod/+/asr/start' : function(topic,site,payload) {
                startMicrophone()
            },
            'hermod/+/asr/stop' : function(topic,site,payload) {
                stopMicrophone()
            },
            'hermod/+/hotword/start' : function(topic,site,payload) {
                startHotword();
            },
            'hermod/+/hotword/stop' : function(topic,site,payload) {
                stopHotword();
            },
            'hermod/+/ready' : function(topic,site,payload) {
                console.log('reload on server restart')
                window.location.reload()
            }        
        }
        
        function concat_arrays(arrays) {
          // sum of individual array lengths
          let totalLength = arrays.reduce((acc, value) => acc + value.length, 0);

          if (!arrays.length) return null;

           let result = new Uint8Array(totalLength);

              // for each array - copy it over result
              // next array is copied right after the previous one
              let length = 0;
              for(let array of arrays) {
                    result.set(array, length);
                    length += array.length;
              }

              return result;
        }
        
        function onMessageArrived(message,payload) {
            //console.log(['MESSAGE ',message,payload])
            if (waitingFor.hasOwnProperty(message)) {
                // callback for sendAndWaitFor
                //console.log('run callback')
                mqttClient.unsubscribe(message)
                waitingFor[message](message,payload)
                delete waitingFor[message]
            } else {
                // handle messageFunction
                var parts = message.split("/")
                // special handling for id in speaker/play/<id>
                if ((parts.length > 4 && parts[2] == "speaker" && parts[3] == "play") || (parts.length > 4 && parts[2] == "speaker" && parts[3] == "cache")) {
                    //console.log('SPAKE ')
                    parts[4]="+";
                }
                var site = parts[1]
                parts[1] = '+'
                var multiSite = parts.join("/")
                //console.log('MATCH '+multiSite)
                //console.log(messageFunctions)
                //console.log(messageFunctions[multiSite])  
                if (messageFunctions.hasOwnProperty(multiSite)) { 
                    //console.log(['CALL ',messageFunctions[multiSite]])
                
                    messageFunctions[multiSite](message,site,payload)
                }
            }
            if (onCallbacks.hasOwnProperty('message')) {
                onCallbacks['message'](message,payload)
            }
        }

        function connect() {
            
            return new Promise(function(resolve,reject) {
                function onConnect() {
                    console.log('connected')
                    console.log(config)
                    if (config.subscribe && config.subscribe.length  > 0) { 
                        mqttClient.subscribe('hermod/rasa/ready',function(err) { 
                            mqttClient.unsubscribe(config.subscribe,function(err) {
                               if (err) console.log(['unSUBSCRIBE ERROR',err])
                                mqttClient.subscribe(config.subscribe,function(err) {
                                   if (err) console.log(['SUBSCRIBE ERROR',err])
                                   console.log(['init subscribed to '+config.subscribe])
                                   sendMessage('hermod/'+config.site+'/asr/activate',{})
                                   if (onCallbacks.hasOwnProperty('connect')) {
                                        onCallbacks['connect']()
                                    }
                                   resolve()
                                });
                            });
                        });
                    } else {
                        sendMessage('hermod/'+config.site+'/asr/activate',{})
                        if (onCallbacks.hasOwnProperty('connect')) {
                            onCallbacks['connect']()
                        }
                        resolve()
                    }
                }
                //console.log('connect')
                
                var options = {
                  clientId: config.username,
                  protocolId: 'MQTT',
                  protocolVersion: 4,
                  clean: false,
                  username: config.username,
                  password: config.password,
                  rejectUnauthorized: false
                }
                
                
                //console.log(config)
                //console.log(options)
                //console.log(config.server)
                //mqttClient  = mqtt.connect(config.server,{username:config.username,password:config.password}) //host:server,port:port,
                mqttClient = mqtt.connect(config.server, options);
                
                mqttClient.on('connect', onConnect)
                mqttClient.on('error', function(e) {
                    console.log('error')
                    console.log(e)
                    if (onCallbacks.hasOwnProperty('disconnect')) {
                        onCallbacks['disconnect']()
                    }
                })
                mqttClient.on('disconnect', function(e) {
                    console.log('disconnect')
                    console.log(e)
                    if (onCallbacks.hasOwnProperty('disconnect')) {
                        onCallbacks['disconnect']()
                    }
                })
                mqttClient.on('reconnect', function(e) {
                    console.log('reconnect')
                    if (onCallbacks.hasOwnProperty('reconnect')) {
                        onCallbacks['reconnect']() 
                    }
                })

                mqttClient.on('message',onMessageArrived);
                //console.log('connect done')
                

            })
            
        }
      
        function disconnect() {
            //console.log('discon')
            //console.log(mqttClient)
            if (onCallbacks.hasOwnProperty('disconnect')) {
                onCallbacks['disconnect']()
            }
            mqttClient.end()
            setTimeout(function() {
                connect()
            },3000)
        }
         
        function sendMessage(topic,payload) {
            mqttClient.publish(topic,JSON.stringify(payload));    
        }
        
        function sendNLUMessage(site,intent,entities) {
            if (!entities) entities = []
            mqttClient.publish('hermod/'+site+'/nlu/intent',JSON.stringify({intent:{name:intent}, entities:entities}));    
        }
        
         
        function sendASRTextMessage(site,text) {
            console.log('send text message '+site+text)
            mqttClient.publish('hermod/'+site+'/asr/text',JSON.stringify({text:text}));    
        }
        
        
        function sendAudioMessage(topic,payload) {
            mqttClient.publish(topic,payload);    
        }
        
        function sendAndWaitFor(sendTopic,payload,waitTopic) {
           // console.log(['send and wait',sendTopic,payload,waitTopic])
            //var innerMqttClient = null;
            return new Promise(function(resolve,reject) {
                mqttClient.subscribe(waitTopic)
                waitingFor[waitTopic] = function() {resolve()};
                mqttClient.publish(sendTopic,JSON.stringify(payload));  
            })
        }
        
        function say(text) {
            return sendAndWaitFor('hermod/'+config.site+'/tts/say',{text:text},'hermod/'+config.site+'/tts/finished')
        }
        
        function sendAudioAndWaitFor(site,audio,waitTopic) {
            sendTopic = 'hermod/' + site +'/microphone/audio'
           // console.log(['send audio and wait',site,audio,waitTopic])
            return new Promise(function(resolve,reject) {
                mqttClient.subscribe(waitTopic)
                waitingFor[waitTopic] = function() {wav2mqtt.stop(); resolve()};
                wav2mqtt.start(mqttClient,site,audio);  
            })
        }
        
        function authenticate() {
            
        }

        function setVolume(volume) {
            console.log('set volume '+volume)
            if (gainNode && gainNode.gain) gainNode.gain.value = volume/100;
        }
        
        function muteVolume() {
            console.log('mute')
            if (gainNode && gainNode.gain) {
                currentVolume = gainNode.gain.value
                gainNode.gain.value = 0.05;
            }
            
        }
        
        function unmuteVolume() {
            console.log('unmute to '+ currentVolume)
            if (currentVolume != null) {
                if (gainNode && gainNode.gain) {
                    gainNode.gain.value = currentVolume;
                    currentVolume = gainNode.gain.value;
                }
            }
        }
         
        function addInputGainNode(node) {
            inputGainNodes.push(node);
        };

        // event functions
        // accept callback for trigger on lifecycle events
        function bind(key,callback) {
            onCallbacks[key] = callback;
        } 
         
        function unbind(key) {
            delete onCallbacks[key]
        } 
            
        ///**
         //* Pause the hotword manager
         //*/ 
        //function stopHotword(site) {
            //if (hotwordManager) hotwordManager.pauseProcessing();
        //};
        
        ///**
         //* Create or continue the hotword manager
         //*/ 
        //function startHotword(site) {
            //console.log(['START HOTWORD',config]);
            //function hotwordCallback(value) {
                //if (!isNaN(value) && parseInt(value,10)>=0) {
                //console.log(['HOTWORD CB',value]);
                    //sendMessage('hermod/'+site+'/hotword/detected',JSON.stringify({}))
                //}
            //};
            
            //if (hotwordManager === null) {
                //console.log(['REALLY START HOTWORD',config]);
                  //let localHotword = 'navy blue';
                  //hotwordManager =  new PicovoiceAudioManager(addInputGainNode,inputvolume);
                  //let singleSensitivity = config.hotwordsensitivity ? config.hotwordsensitivity/100 : 0.9;
                  //let sensitivities=new Float32Array([singleSensitivity]);
                  //let selectedKeyword = null;
                  //if (HotwordResources.keywordIDs.hasOwnProperty(localHotword)) {
                      //selectedKeyword = HotwordResources.keywordIDs[localHotword];
                      //console.log(['SELECTED KW',localHotword,selectedKeyword]);
                      //hotwordManager.start(Porcupine.create([selectedKeyword], sensitivities), hotwordCallback, function(e) {
                        //console.log(['HOTWORD error',e]);
                      //});
                  //}                  

              //} else {
                  //if(hotwordManager) hotwordManager.continueProcessing();
              //}
      
        //};
        
        
                
       

        function startHotword() {
            //console.log('start hw')
            if (onCallbacks.hasOwnProperty('hotwordStart')) {
                onCallbacks['hotwordStart']()
            }
            hotwordStarted = true;
            if (!hotwordInitialised) {
                let processCallback = function (keyword) {
                    //console.log('heard '+keyword)
                    if (keyword && hotwordStarted) {
                        //console.log('heard and accept '+keyword)
                        sendMessage('hermod/'+config.site+'/hotword/detected',{})
                        if (onCallbacks.hasOwnProperty('hotwordDetected')) {
                            onCallbacks['hotwordDetected'](keyword)
                        }
                        
                        startMicrophone()
                    }
                };

                
                let audioManagerErrorCallback = function (ex) {
                    console.log(ex.toString());
                };

                //if (!porcupineManager) {
                    //console.log('CREATE NEW porc WORKER')
                    porcupineManager = PorcupineManager("./porcupine/porcupine_worker.js");
                //}
                porcupineManager.start(KeywordData, SENSITIVITIES, processCallback, audioManagerErrorCallback);
                hotwordInitialised = true;
            }
        };

        function stopHotword() {
            if (onCallbacks.hasOwnProperty('hotwordStop')) {
                onCallbacks['hotwordStop']()
            }
            //console.log('stop how')
            //console.log(porcupineManager)
            //porcupineManager.stop();
            hotwordStarted = false;
        };
        

        
        /**
         * HELPER FUNCTIONS
         */
        //function playSound(byteArray) {
            //console.log('play sopuid')
            //console.log(byteArray)
            //return new Promise(function(resolve,reject) {
                //console.log('in prom')
                //// Create blob from Uint8Array & Object URL.
                //const blob = new Blob([new Uint8Array(byteArray)], { type: 'audio/wav' });
                //const url = URL.createObjectURL(blob);
                //console.log('got url')
                //console.log(url);
                //// Get DOM elements.
                //const audio = document.createElement('audio');
                //const source = document.createElement('source');

                //// Insert blob object URL into audio element & play.
                //source.src = url;
                    //console.log('set src')
                
                //audio.load();
                    //console.log('loaded')
                //audio.play();
                    //console.log('played')
                //audio.on('ended',function() {
                    //console.log('ended')
                    //resolve()
                //})

                
            //})
        //}
        
        function stopPlaying() {
            console.log('STOP PLAY')
             if (bufferSource) {
                 console.log('STOP PLAY real')
                 bufferSource.stop()
             }
        };
        
        function playSound(bytes) {
            // console.log('PLAY SOUND BYTES')
            return new Promise(function(resolve,reject) {
                try {
                    if (bytes) {
                       // var myAudio = document.createElement('audio');

                        //if (myAudio.canPlayType('audio/mpeg')) {
                          //myAudio.setAttribute('src','audiofile.mp3');
                        //}
                        
                       // console.log('PLAY SOUND BYTES have bytes'+bytes.length)
                        var buffer = new Uint8Array( bytes.length );
                        buffer.set( new Uint8Array(bytes), 0 );
                        let audioContext = window.AudioContext || window.webkitAudioContext;
                        let context = new audioContext();
                        gainNode = context.createGain();
                        
                        gainNode.gain.value =  outputvolume; //config.speakervolume/100 ? config.speakervolume/100 :
                        //console.log('PLAY SOUND BYTES decode')
                            context.decodeAudioData(buffer.buffer, function(audioBuffer) {
                            //console.log('PLAY SOUND BYTES decoded')
                           // console.log(audioBuffer);
                            // global bufferSource for share with stopPlaying
                            bufferSource = context.createBufferSource();
                            bufferSource.buffer = audioBuffer;
                            bufferSource.connect(gainNode);
                            gainNode.connect( context.destination );
                            try {
                                bufferSource.start(0);
                                //resolve()
                            } catch (e) {
                                console.log('play sound error starting')
                                console.log(e)
                                resolve()
                            }
                            bufferSource.onended = function() {
                                console.log('PLAY SOUND BYTES source ended')
                                //setTimeout(stopPlaying,100)
                                resolve();
                            };
                            bufferSource.onerror = function() {
                                console.log('PLAY SOUND BYTES source error')
                                resolve();
                            };
                        },function(e) {
                             console.log('PLAY SOUND BYTES decode FAIL')
                             console.log(e)
                             resolve()   
                        });
                        //resolve()
                    } else {
                        console.log('PLAY SOUND BYTES no bytes')
                        resolve();
                    }
                } catch (e) {
                    console.log('PLAY SOUND BYTES err')
                    console.log(e)
                    resolve()
                }
            });                        
        }
        
           
        /**
         * Bind silence recognition events to set speaking state
         */ 
        function bindSpeakingEvents() {
             //console.log('bind speaking')
             if (!navigator.getUserMedia) {
                navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
             }
             try {
                if (navigator.getUserMedia) {
                  navigator.getUserMedia({audio:true}, function(stream) {
                    //console.log('bind speaking have audoi')
                    var options = {};
                    var speechEvents = hark(stream, options);

                    speechEvents.on('speaking', function() {
                      clearTimeout(speakingTimeout)
                      //console.log('speaking');
                      // DISABLE BUFFER   
                      //sendAudioBuffer(config.site) 
                      speaking = true
                      if (onCallbacks.hasOwnProperty('speaking')) {
                        onCallbacks['speaking']()
                      }
                    });

                    speechEvents.on('stopped_speaking', function() {
                      // send an extra second of silence for ASR
                      speakingTimeout = setTimeout(function() {
                             clearTimeout(speakingTimeout)
                             //console.log('stop speaking');
                             speaking = false
                             if (onCallbacks.hasOwnProperty('stopspeaking')) {
                                onCallbacks['stopspeaking']()
                             }
                      },3000);
                    });    
                      
                  }, function(e) {
                    console.log(['MIC Error capturing audio.',e]);
                  });
                } else {
                    console.log('MIC getUserMedia not supported in this browser.');
                }
             }   catch (e) {
                 console.log(e);
             }
            
        };
        
        function getThreshholdFromVolume(volume) {
            return 10 * Math.log((101 - volume )/800);
        };
        
        
        function bufferAudio(audio) {
            microphoneAudioBuffer.push(audio);
            if (microphoneAudioBuffer.length > 30) {
                microphoneAudioBuffer.shift();
            }
        }
        
        function sendAudioBuffer(site) {
            //console.log(['SEND BUFFER'])
            for (var a in microphoneAudioBuffer) {
                sendAudioMessage('hermod/'+site+'/microphone/audio',microphoneAudioBuffer[a]);
            }
            microphoneAudioBuffer = [];
        }
        
        
        function startMicrophone() {
            console.log('start rec -'+config.site)
            isSending = true;
            //stopPlaying()
            muteVolume()
            if (onCallbacks.hasOwnProperty('microphoneStart')) {
                onCallbacks['microphoneStart']()
            }
            //sendMessage('hermod/'+config.site+'/asr/start',{})
            
        }
        
            
        function gotDevices(deviceInfos,site) {
          // Handles being called several times to update labels. Preserve values.
          console.log(['GOT DEV',site,deviceInfos])
          device = 'default'
          devices={}
          for (let i = 0; i !== deviceInfos.length; ++i) {
            const deviceInfo = deviceInfos[i];
            if (deviceInfo.kind === 'audioinput') {
                console.log(deviceInfo.label)
                console.log(deviceInfo.deviceId)
                devices[deviceInfo.label] = deviceInfo.deviceId
                if (deviceInfo.label && deviceInfo.label.toLowerCase().indexOf('speakerphone') !== -1) {
                    console.log('found speakerphone')
                    device = deviceInfo.deviceId
                }
            }
            devices['FINAL'] = device
            showSlots(devices)
          }
          activateRecording(site,device)
        }

        function handleError(error) {
          console.log('navigator.MediaDevices.getUserMedia error: ', error.message, error.name);
        }
        
        
        function activateRecording(site,deviceId) {
            console.log('activate rec'+site + deviceId)
            //this.setState({sending:true});
            //if (onCallbacks.hasOwnProperty('microphoneStart')) {
                //onCallbacks['microphoneStart']()
            //}
            //bindSpeakingEvents()z
            if (isRecording) return;
            isRecording = true;
            
            if (!navigator.getUserMedia) {
                navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia ||
            navigator.mozGetUserMedia || navigator.msGetUserMedia;
            }
            
            try {
                if (navigator.getUserMedia) {
                    // TODO https://github.com/webrtc/samples/blob/gh-pages/src/content/devices/input-output/js/main.js
                    // SELECT AUDIO INPUT DEVICE, PREFER SPEAKERPHONE IF AVAILABLE TO HELP MOBILE
                    // NOTE CAN SET GAIN VOLUME > 1 
                    //{deviceId: {exact: deviceId}}
                  navigator.getUserMedia({audio:true}, success, function(e) {
                    console.log(['dMIC Error capturing audio.',e]);
                  });
                } else {
                    console.log('MIC getUserMedia not supported in this browser.');
                }
             }   catch (e) {
                 console.log(e);
             }
            function success(e) {
                  console.log('got navigator')
                  var audioContext = window.AudioContext || window.webkitAudioContext;
                  var context = new audioContext();
                  var gainNode = context.createGain();
                  gainNode.gain.value = inputvolume;
                  var audioInput = context.createMediaStreamSource(e);
                  
                  
                  var bufferSize = 4096;
                  
                    function convertFloat32ToInt16(buffer) {
                      if (buffer) {
                          let l = buffer.length;
                          let buf = new Int16Array(l);
                          while (l--) {
                            buf[l] = Math.min(1, buffer[l])*0x7FFF;
                          }
                          return buf.buffer;
                      }
                    }
                    
                    function resample(sourceAudioBuffer,TARGET_SAMPLE_RATE,onComplete) {
                          var offlineCtx = new OfflineAudioContext(sourceAudioBuffer.numberOfChannels, sourceAudioBuffer.duration * sourceAudioBuffer.numberOfChannels * TARGET_SAMPLE_RATE, TARGET_SAMPLE_RATE);
                          var buffer = offlineCtx.createBuffer(sourceAudioBuffer.numberOfChannels, sourceAudioBuffer.length, sourceAudioBuffer.sampleRate);
                          // Copy the source data into the offline AudioBuffer
                          for (var channel = 0; channel < sourceAudioBuffer.numberOfChannels; channel++) {
                              buffer.copyToChannel(sourceAudioBuffer.getChannelData(channel), channel);
                          }
                          // Play it from the beginning.
                          var source = offlineCtx.createBufferSource();
                          source.buffer = sourceAudioBuffer;
                          source.connect(offlineCtx.destination); 
                          source.start(0);
                          offlineCtx.oncomplete = function(e) {
                            // `resampled` contains an AudioBuffer resampled at 16000Hz.
                            // use resampled.getChannelData(x) to get an Float32Array for channel x.
                            var resampled = e.renderedBuffer;
                            var leftFloat32Array = resampled.getChannelData(0);
                            // use this float32array to send the samples to the server or whatever
                            onComplete(leftFloat32Array);
                          }
                          offlineCtx.startRendering();
                    }
         
                  let recorderTimeout = null;  
                  let recorder = context.createScriptProcessor(bufferSize, 1, 1);
                  recorder.onaudioprocess = function(e){
                      //console.log(['onaudio',isRecording  ,isSending ])
                        
                      //  var left = e.inputBuffer.getChannelData(0);
                      // && that.state.speaking && that.state.started
                      if (isRecording  && isSending) { // && speaking) {
                          //console.log(['REC'])
                          resample(e.inputBuffer,16000,function(res) {
                            if (! isPlaying) { 
                                if (speaking) {
                                    if (recorderTimeout) clearTimeout(recorderTimeout)
                                    console.log(['SEND '+'hermod/'+site+'/microphone/audio'])
                                    sendAudioMessage('hermod/'+site+'/microphone/audio',Buffer.from(convertFloat32ToInt16(res)))
                                } else {
                                    if (!recorderTimeout) setTimeout(function() {stopMicrophone(); startHotword()},5000)
                                    console.log(['BUFFER'])
                                    bufferAudio(Buffer.from(convertFloat32ToInt16(res)));
                                }
                            } else {
                                console.log('BAN DURING PLAY')
                            }
                          });
                      }
                  }
                  
                gainNode.connect(recorder);
                audioInput.connect(gainNode);
                recorder.connect(context.destination); 
               //   console.log(['REC started'])
                        
            }
        
        }
        function stopMicrophone() {
            isSending = false;
            
            if (onCallbacks.hasOwnProperty('microphoneStop')) {
                onCallbacks['microphoneStop']()
            }
            //sendMessage('hermod/'+config.site+'/asr/stop',{})
            console.log('stop mic unmute')
            unmuteVolume()
        }
        function stopAll() {
            stopHotword()
            stopMicrophone()
            //disconnect() 
        }   
        
        function init() {
            navigator.mediaDevices.enumerateDevices().then(function(info){ gotDevices(info,config.site)} ).catch(handleError);
            //activateRecording(config.site)
            bindSpeakingEvents()
        }
        
        init()
             
        return {setVolume: setVolume, muteVolume: muteVolume, unmuteVolume: unmuteVolume, playSound: playSound, stopPlaying: stopPlaying, say:say, stopAll:stopAll, bind:bind,unbind:unbind,startMicrophone: startMicrophone, stopMicrophone: stopMicrophone, sendAndWaitFor:sendAndWaitFor,sendAudioAndWaitFor:sendAudioAndWaitFor,sendMessage:sendMessage,sendNLUMessage:sendNLUMessage,sendASRTextMessage:sendASRTextMessage,authenticate:authenticate,connect:connect,disconnect:disconnect,startHotword:startHotword,stopHotword:stopHotword}
}

module.exports=HermodWebClient 
try {
    if (window) {
        window.HermodWebClient = HermodWebClient
    }
} catch (e) {}

