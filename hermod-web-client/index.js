//var Porcupine = require('./porcupine/porcupine')
var PorcupineManager = require('./porcupine/porcupine_manager')
var WebVoiceProcessor = require('./porcupine/web_voice_processor')
var KeywordData =  require('./porcupine/keyword_data')
//var PorcupineWorker =  require('./porcupine/porcupine_worker')
//var DownsampleWorker =  require('./porcupine/downsampling_worker')
//var PorcupineModule =  require('./porcupine/pv_porcupine')

//console.log('MODULE')
//console.log(PorcupineModule())

try {
    window.PorcupineManager = PorcupineManager
    window.WebVoiceProcessor = WebVoiceProcessor
    window.KeywordData = KeywordData
    //window.PorcupineModule = PorcupineModule()
    //window.PorcupineWorker = PorcupineWorker
    //window.DownsampleWorker = DownsampleWorker
} catch(e) {}
 

//var Module = require('./pv_porcupine')
   
   
//var mqtt = require('mqtt')
////var mqtt = require('./mqttws31.min.js')
////console.log('MQTT')
////console.log(mqtt)
//var wav2mqtt = require('./wav2mqtt')
//var Porcupine = require('./porcupine')  
//var PicovoiceAudioManager = require('./picovoiceAudioManager')
//let HotwordResources={};
//HotwordResources.keywordIDs = {
        //'ok lamp': new Uint8Array([
            //0xac, 0x24, 0x75, 0x21, 0x14, 0x3d, 0x2a, 0xe7, 0x0a, 0x85, 0x75, 0x4c,
            //0x48, 0x31, 0x5b, 0x44, 0x4b, 0xb6, 0xe8, 0xc3, 0x77, 0x30, 0xd5, 0xac,
            //0xca, 0x54, 0x06, 0x29, 0xbd, 0x15, 0xca, 0x90, 0x55, 0x81, 0xae, 0x21,
            //0x6a, 0x04, 0x1e, 0x5a, 0x9d, 0x64, 0x83, 0x0c, 0x04, 0x03, 0x6b, 0xe8,
            //0x22, 0x2e, 0x19, 0xbf, 0x7e, 0x2b, 0x4d, 0x8c, 0x50, 0x27, 0xb6, 0x11,
            //0xf3, 0x17, 0xc3, 0xf9, 0xe3, 0x69, 0x19, 0x26, 0xbe, 0x0d, 0xad, 0x78,
            //0x74, 0x61, 0x4b, 0xb8, 0xde, 0x83, 0x1c, 0xb9, 0xa1, 0x06, 0x27, 0x77,
            //0x03, 0xb2, 0x24, 0x82]),
         //'navy blue': new Uint8Array([
            //0xd9, 0x36, 0xb2, 0xcc, 0x5d, 0xbb, 0x2b, 0x66, 0xae, 0xbb, 0x39, 0xf3,
            //0x24, 0xf4, 0x02, 0xf2, 0xb9, 0x5a, 0xf7, 0xd7, 0x8d, 0x02, 0xbc, 0x7b,
            //0xa3, 0x04, 0xb3, 0xfd, 0x2c, 0x0b, 0x9c, 0x10, 0x2c, 0x28, 0x6f, 0x65,
            //0x3f, 0xb9, 0x39, 0x08, 0x44, 0x62, 0x47, 0x3a, 0xd8, 0x6d, 0xe7, 0x4a,
            //0xd9, 0x64, 0x50, 0x6b, 0xd0, 0x39, 0x7e, 0x43, 0x05, 0xeb, 0xf8, 0xc2,
            //0xe7, 0xab, 0xf5, 0x39, 0x88, 0xd4, 0x99, 0x3c, 0x2d, 0x2a, 0xf2, 0xeb,
            //0x69, 0x5b, 0x34, 0x7b, 0x51, 0x61, 0x83, 0x82, 0x08, 0x76, 0xdf, 0x86,
            //0xab, 0xe8, 0x83, 0x48]),
//};


//var HermodWebClient = function(config) {
        
        //var mqttClient = null;
        //var isRecording = false;
        //var isSending = false;
        //var waitingFor = {}
        //var hotwordManager = null;
        //var inputvolume = 0.9
        //var outputvolume = 0.7
        //var site = null;
        //var inputGainNodes=[];
        
        //var messageFunctions = {
            //// SPEAKER
            //'hermod/+/speaker/play' : function(topic,site,payload) {
               //console.log(['speaker play',site,payload]);
                //if (site && site.length > 0) { 
                    //mqttClient.publish("hermod/"+site+"/speaker/started",JSON.stringify({})); 
					//playSound(payload).then(function() {
                        //mqttClient.publish("hermod/"+site+"/speaker/finished",JSON.stringify({})); 
					//}); 
                //}
            //},
            //'hermod/+/hotword/detected': function(topic,site,payload) {
                //// quarter volume for 10 seconds
            //} ,
            //'hermod/+/microphone/start' : function(topic,site,payload) {
                //startMicrophone(site)
            //},
            //'hermod/+/microphone/stop' : function(topic,site,payload) {
                //stopMicrophone()
            //},
            //'hermod/+/hotword/start' : function(topic,site,payload) {
               //startHotword(site);
            //},
            //'hermod/+/hotword/stop' : function(topic,site,payload) {
                //stopHotword(site);
            //}         
        //}
        
        //function onMessageArrived(message,payload) {
            //console.log(['MESSAGE ',message,payload])
            //if (waitingFor.hasOwnProperty(message)) {
                //// callback for sendAndWaitFor
                //console.log('run callback')
                //mqttClient.unsubscribe(message)
                //waitingFor[message](message,payload)
                //delete waitingFor[message]
            //} else {
                //// handle messageFunction
                //var parts = message.split("/")
                //var site = parts[1]
                //parts[1] = '+'
                //var multiSite = parts.join("/")
                //if (messageFunctions.hasOwnProperty(multiSite)) { 
                    //messageFunctions[multiSite](message,site,payload)
                //}
            //}
        //}

        //function connect() {
            
            //return new Promise(function(resolve,reject) {
                //function onConnect() {
                    //console.log('connected')
                    //console.log(config)
                    //if (config.subscribe && config.subscribe.length  > 0) { 
                        //mqttClient.unsubscribe(config.subscribe,function(err) {
                           //if (err) console.log(['unSUBSCRIBE ERROR',err])
                            //mqttClient.subscribe(config.subscribe,function(err) {
                               //if (err) console.log(['SUBSCRIBE ERROR',err])
                               //console.log(['init subscribed to '+config.subscribe])
                               //resolve()
                            //});
                        //});
                    //} else {
                        //resolve()
                    //}
                    
                //}
                //console.log('connect')
                //console.log(config)
                ////mqttClient  = mqtt.connect(config.server,{username:config.username,password:config.password}) //host:server,port:port,
                //mqttClient = mqtt.connect(config.server, 'someclient');
                
                //mqttClient.on('connect', onConnect)
                //mqttClient.on('error', console.error)
                //mqttClient.on('message',onMessageArrived);
                //console.log('connect done')
                

            //})
            
        //}
      
        //function disconnect() {
            ////console.log('discon')
            ////console.log(mqttClient)
            //mqttClient.end()
        //}
        
        //function sendMessage(topic,payload) {
            //mqttClient.publish(topic,JSON.stringify(payload));    
        //}
        
        //function sendAndWaitFor(sendTopic,payload,waitTopic) {
            //console.log(['send and wait',sendTopic,payload,waitTopic])
            ////var innerMqttClient = null;
            //return new Promise(function(resolve,reject) {
                //mqttClient.subscribe(waitTopic)
                //waitingFor[waitTopic] = function() {resolve()};
                //mqttClient.publish(sendTopic,JSON.stringify(payload));  
            //})
        //}
        
        //function sendAudioAndWaitFor(site,audio,waitTopic) {
            //sendTopic = 'hermod/' + site +'/microphone/audio'
            //console.log(['send audio and wait',site,audio,waitTopic])
            //return new Promise(function(resolve,reject) {
                //mqttClient.subscribe(waitTopic)
                //waitingFor[waitTopic] = function() {wav2mqtt.stop(); resolve()};
                //wav2mqtt.start(mqttClient,site,audio);  
            //})
        //}
        
        //function authenticate() {
            
        //}

        ///**
         //* API FUNCTIONS
         //*/
         
         
        //function addInputGainNode(node) {
            //inputGainNodes.push(node);
        //};

             
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
            
     


        //function setMicrophoneVolume() {
            
        //}

        //function setSpeakerVolume() {
            
        //}
        
        
        ///**
         //* HELPER FUNCTIONS
         //*/
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
        //function playSounddis(bytes) {
            //console.log('PLAY SOUND BYTES')
            //return new Promise(function(resolve,reject) {
                //try {
                    //if (bytes) {
                        
                        
                        //var myAudio = document.createElement('audio');

                        //if (myAudio.canPlayType('audio/mpeg')) {
                          //myAudio.setAttribute('src','audiofile.mp3');
                        //}
                        
                        //console.log('PLAY SOUND BYTES have bytes'+bytes.length)
                        //var buffer = new Uint8Array( bytes.length );
                        //buffer.set( new Uint8Array(bytes), 0 );
                        //let audioContext = window.AudioContext || window.webkitAudioContext;
                        //let context = new audioContext();
                        //let gainNode = context.createGain();
                        //gainNode.gain.value =  1.0; //config.speakervolume/100 ? config.speakervolume/100 :
                        //console.log('PLAY SOUND BYTES decode')
                            //context.decodeAudioData(buffer.buffer, function(audioBuffer) {
                            //console.log('PLAY SOUND BYTES decoded')
                            //console.log(audioBuffer);
                            //var source = context.createBufferSource();
                            //source.buffer = audioBuffer;
                            //source.connect(gainNode);
                            //gainNode.connect( context.destination );
                            //source.start(0);
                            //source.onended = function() {
                                //console.log('PLAY SOUND BYTES source ended')
                                //resolve();
                            //};
                        //},function(e) {
                             //console.log('PLAY SOUND BYTES decode FAIL')
                             //console.log(e)
                             //resolve()   
                        //});
                        ////resolve()
                    //} else {
                        //console.log('PLAY SOUND BYTES no bytes')
                        //resolve();
                    //}
                //} catch (e) {
                    //console.log('PLAY SOUND BYTES err')
                    //console.log(e)
                    //resolve()
                //}
            //});                        
        //}
    
        
        //function startMicrophone(site) {
            //console.log('start rec')
            //isSending = true;
            //if (!isRecording) activateRecording(site)
            
        //}
        
        //function activateRecording(site) {
            //console.log('activate rec')
            ////this.setState({sending:true});
            //if (isRecording) return;
            //isRecording = true;
            
            //if (!navigator.getUserMedia) {
                //navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia ||
            //navigator.mozGetUserMedia || navigator.msGetUserMedia;
            //}
             //try {
                //if (navigator.getUserMedia) {
                  //navigator.getUserMedia({audio:true}, success, function(e) {
                    //console.log(['MIC Error capturing audio.',e]);
                  //});
                //} else {
                    //console.log('MIC getUserMedia not supported in this browser.');
                //}
             //}   catch (e) {
                 //console.log(e);
             //}
            //function success(e) {
                  //console.log('got navigator')
                  //var audioContext = window.AudioContext || window.webkitAudioContext;
                  //var context = new audioContext();
                  //var audioInput = context.createMediaStreamSource(e);
                  //var bufferSize = 2048;
                  
                    //function convertFloat32ToInt16(buffer) {
                      //if (buffer) {
                          //let l = buffer.length;
                          //let buf = new Int16Array(l);
                          //while (l--) {
                            //buf[l] = Math.min(1, buffer[l])*0x7FFF;
                          //}
                          //return buf.buffer;
                      //}
                    //}
                    
                    //function resample(sourceAudioBuffer,TARGET_SAMPLE_RATE,onComplete) {
                          //var offlineCtx = new OfflineAudioContext(sourceAudioBuffer.numberOfChannels, sourceAudioBuffer.duration * sourceAudioBuffer.numberOfChannels * TARGET_SAMPLE_RATE, TARGET_SAMPLE_RATE);
                          //var buffer = offlineCtx.createBuffer(sourceAudioBuffer.numberOfChannels, sourceAudioBuffer.length, sourceAudioBuffer.sampleRate);
                          //// Copy the source data into the offline AudioBuffer
                          //for (var channel = 0; channel < sourceAudioBuffer.numberOfChannels; channel++) {
                              //buffer.copyToChannel(sourceAudioBuffer.getChannelData(channel), channel);
                          //}
                          //// Play it from the beginning.
                          //var source = offlineCtx.createBufferSource();
                          //source.buffer = sourceAudioBuffer;
                          //source.connect(offlineCtx.destination);
                          //source.start(0);
                          //offlineCtx.oncomplete = function(e) {
                            //// `resampled` contains an AudioBuffer resampled at 16000Hz.
                            //// use resampled.getChannelData(x) to get an Float32Array for channel x.
                            //var resampled = e.renderedBuffer;
                            //var leftFloat32Array = resampled.getChannelData(0);
                            //// use this float32array to send the samples to the server or whatever
                            //onComplete(leftFloat32Array);
                          //}
                          //offlineCtx.startRendering();
                    //}
         
                    
                  //let recorder = context.createScriptProcessor(bufferSize, 1, 1);
                  //recorder.onaudioprocess = function(e){
                      ////console.log(['onaudio',isRecording  ,isSending ])
                        
                      ////  var left = e.inputBuffer.getChannelData(0);
                      //// && that.state.speaking && that.state.started
                      //if (isRecording  && isSending ) {
                        ////  console.log(['REC'])
                          //resample(e.inputBuffer,16000,function(res) {
                            //sendMessage('hermod/'+site+'/microphone/audio',Buffer.from(convertFloat32ToInt16(res)))
                          //});
                      //}
                  //}
                  
                //audioInput.connect(recorder);
                //recorder.connect(context.destination); 
                  //console.log(['REC started'])
                        
            //}
        
        //}
        //function stopMicrophone() {
            //isSending = false;
        //}
                
        //return {startMicrophone: startMicrophone, stopMicrophone: stopMicrophone, sendAndWaitFor:sendAndWaitFor,sendAudioAndWaitFor:sendAudioAndWaitFor,sendMessage:sendMessage,authenticate:authenticate,connect:connect,disconnect:disconnect,startHotword:startHotword,stopHotword:stopHotword,setMicrophoneVolume:setMicrophoneVolume,setSpeakerVolume:setSpeakerVolume}
//}

//module.exports=HermodWebClient 
//try {
    //if (window) {
        //window.HermodWebClient = HermodWebClient
    //}
//} catch (e) {}


    ////addInputGainNode(node) {
        ////this.inputGainNodes.push(node);
    ////};
    
    ////appendUserId(text,user) {
        ////if (user && user._id) {
            ////return text+"_"+user._id;
        ////} else {
            ////return text;
        ////}
    ////};
   
  
    
    ///////**
     //////* Bind silence recognition events to set speaking state
     //////*/ 
    ////bindSpeakingEvents(audioContext,e) {
        ////console.log(['bindSpeakingEvents'])
        ////let that = this;
        ////var options = {audioContext:audioContext};
        //////options.threshhold = this.getThreshholdFromVolume(this.state.config.silencesensitivity);
        ////// bind speaking events care of hark
            ////this.speechEvents = hark(e, options);
            ////this.speechEvents.on('speaking', function() {
             ////// if (that.state.config.silencedetection !== "no") {
                  ////console.log('speaking');
                  ////if (that.speakingTimeout) clearTimeout(that.speakingTimeout);
                  ////that.setState({speaking:true});
             //////   }
            ////});
            
            ////this.speechEvents.on('stopped_speaking', function() {
                //////if (that.state.config.silencedetection !== "no") {
                  ////if (that.speakingTimeout) clearTimeout(that.speakingTimeout);
                  ////that.speakingTimeout = setTimeout(function() {
                     ////console.log('stop speaking');
                     ////that.setState({speaking:false});
                  ////},1000);
               ////// }
              
            ////});            
        
    ////};

    ////getThreshholdFromVolume(volume) {
        ////return 10 * Math.log((101 - volume )/800);
    ////};
