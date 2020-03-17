var mqtt = require("./mqttconnect");
var config = require('./config')
var wav2mqtt = require('./wav2mqtt')
var mqtt2wav = require('./mqtt2wav')
var setupTests = require('./setupTests')
var kill  = require('tree-kill');
var path = require('path')
var fs = require('fs')
var timeout = null;
var services = null;

    

beforeAll(() => {
    return new Promise(function(resolve,reject) {    
        //const exec = require('child_process').exec;
        //services = exec('../hermod-python/bin/python3 ../hermod-python/services.py', (e, stdout, stderr)=> {
            //if (e instanceof Error) {
                //console.error(e);
                //throw e;
            //}
            //console.log('stdout ', stdout);
            //console.log('stderr ', stderr);
        //});
        
        //require('child_process').spawn( '/usr/bin/docker' ,['kill','hermod-python'])
        //setTimeout(function() {
            require('child_process').spawn( '/usr/bin/docker' ,['rm','hermod-python'])
            setTimeout(function() {
                //services = require('child_process').spawn( '../hermod-python/bin/python3' , ['../hermod-python/services.py']); //, '--keywords picovoice', '--site '+props.siteId 
                //services = require('child_process').spawn( './run.sh' ); //, '--keywords picovoice', '--site '+props.siteId 
                services = require('child_process').spawn( '/usr/bin/docker' ,['run' ,'--privileged' ,'--name','hermod-python','-i','-v','/dev/snd:/dev/snd','-v','/projects/hermod/hermod-python/src:/app/src','-p','1883:1883','-p','8080:8080','syntithenai/hermod-python','-m'])  
                services.stdout.on('data', function(data) {
                    console.log(data.toString()); 
                });
                services.stderr.on('data', function(data) {
                    console.log(data.toString()); 
                });
                // wait for services to start
                setTimeout(function() {resolve()},2000)
            },500);
         //},1000);
    })
});

afterAll(() => {
    return new Promise(function(resolve,reject) {
        if (services) {
           // console.log('KILL SERVICES')
            services.kill()
            
        }
        require('child_process').spawn( '/usr/bin/docker' ,['kill','hermod-python'])
        setTimeout(function() {
            require('child_process').spawn( '/usr/bin/docker' ,['rm','hermod-python'])
            if (mqtt && mqtt.disconnect) mqtt.disconnect()
            resolve()
        },4000)
    })
    clearTimeout(timeout)
})



//test('NLU parse', () => {
    //return new Promise(function(resolve,reject) {
        //mqtt.connect(config).then(function(mqttClient) {
            //mqttClient.subscribe('hermod/jest/nlu/intent')
            //mqttClient.on('message', function(message,body) {
                //if (message=='hermod/jest/nlu/intent') {
                    //console.log([message,body.toString()])
                    
                    ////if (JSON.stringify(JSON.parse(body.toString())) == JSON.stringify(payload)) {
                        //mqttClient.unsubscribe('hermod/jest/nlu/intent')
                        //resolve()
                    ////} else {
                        ////console.log('BROKEN PAYLOAD PASS ON NLU/INTENT')
                    ////}
                //} 
            //});
            //mqttClient.publish('hermod/jest/nlu/parse',JSON.stringify({query:"hello"}))
        //})
    //})    
//},100);




////test('dummy',function() {
    ////return new Promise(function (resolve,reject) {
        ////setTimeout(function() {resolve()},5000)
    ////})
////})

////////////////////////
////// ASR
////// THESE TESTS REQUIRE UNDERLYING AUDIO SERVICES
//////////////////////////



//test('asr text detected - my name is fred', () => {
    //site='jost'
    //return new Promise(function(resolve,reject) {
        //mqtt.connect(config).then(function(mqttClient) {
            //mqttClient.subscribe('hermod/'+site+'/asr/text')
            //mqttClient.on('message', function(message,b) {
                //console.log(message)
                //console.log(b)
                //if (message == "hermod/"+site+"/asr/text") { 
                    //let body = {}
                    //try {
                        //body = JSON.parse(b) 
                    //} catch (e) {}
                    //console.log(body.text)
                    //mqttClient.publish('hermod/'+site+'/asr/deactivate')
                    //mqtt2wav.stop(mqttClient,site);
                    //resolve()
                    
                    //if (body && body.text && (body.text.trim() == 'my name is fred' )) { 
                        //mqttClient.unsubscribe('hermod/'+site+'/asr/text')
                        //mqttClient.publish('hermod/'+site+'/asr/deactivate')
                        //mqtt2wav.stop(mqttClient,site);
                        //resolve()
                    //} else {
                        //mqttClient.unsubscribe('hermod/'+site+'/asr/text')
                        //mqttClient.publish('hermod/'+site+'/asr/deactivate')
                        //mqtt2wav.stop(mqttClient,site);
                        //reject()
                    //} 
                //}
            //});
            //mqttClient.publish('hermod/'+site+'/asr/activate')
            //setTimeout(function() {
                //mqttClient.publish('hermod/'+site+'/asr/start')
                //setTimeout(function() {wav2mqtt.start(mqttClient,site,'./audio/fred.wav') }, 100)
            //},1500)
        //})
    //})  
//},8000);




//test('hotword detected', () => {
    //let started = false;
    //let played = false;
    //site='just'
    //return new Promise(function(resolve,reject) {
        //mqtt.connect(config).then(function(mqttClient) {
            //mqttClient.subscribe('hermod/'+site+'/hotword/detected')
            //mqttClient.on('message', function(message,body) {
                //if (message == 'hermod/'+site+'/hotword/detected') {
                    //mqttClient.publish('hermod/'+site+'/hotword/stop')
                    //mqttClient.publish('hermod/'+site+'/hotword/deactivate')
                    //mqttClient.publish('hermod/'+site+'/dialog/end')
                    //mqttClient.unsubscribe('hermod/'+site+'/hotword/detected')
                    //setTimeout(function() {resolve()},1000)
                //} 
            //});
            //mqttClient.publish('hermod/'+site+'/hotword/activate')
            //setTimeout(function() {
                //mqttClient.publish('hermod/'+site+'/hotword/start')
                //setTimeout(function() {wav2mqtt.start(mqttClient,site,'audio/picovoice.wav') }, 1000)
            //},1000)
        //})
    //})    
    
//},7000);


    ////////////////////////
     //////////Audio Services
    //////////////////////////

    ////////// TODO enable this test with two preceding and this test fails. remove previous tests and it works.

    //////// TODO test stop and volume and mp3 play
    //test('speaker plays wav', () => {
        //let started = false;
        //return new Promise(function(resolve,reject) {
            //mqtt.connect(config).then(function(mqttClient) {
                //mqttClient.subscribe('hermod/jest/speaker/#')
                //mqttClient.on('message', function(message,body) {
                    ////console.log('spw message')
                    ////console.log(message)
                    
                    //if (message == "hermod/jest/speaker/started") started = true;
                    //if (started && message == "hermod/jest/speaker/finished") {
                        //mqttClient.unsubscribe('hermod/jest/speaker/#')
                        //resolve();
                    //}
                //});
                
                //fs.readFile('./audio/test.wav', function(err, testwav) {
                    //if (err) console.log(['ERR failed to read testfile:',err])
                    //mqttClient.publish('hermod/jest/speaker/play/999',testwav)
                //})    
            //})
        //})    
    //},2000);

     //TODO capture, check packets??
    test('microphone sends audio when started', () => {
        
        return new Promise(function(resolve,reject) {
            mqtt.connect(config).then(function(mqttClient) {
                mqttClient.subscribe('hermod/jest/microphone/audio')
                mqttClient.on('message', function(message,body) {
                    //console.log('msa message')
                    //console.log(message)
                    if (message == "hermod/jest/microphone/audio") {
                        mqttClient.unsubscribe('hermod/jest/microphone/audio')
                        //mqttClient.publish('hermod/jest/microphone/stop',null);
                        resolve()
                    }
                });
                //console.log('publish start')
                mqttClient.publish('hermod/jest/microphone/start',null);
                setTimeout(function() {
                    mqttClient.publish('hermod/jest/microphone/stop',null);
                },200)
            })    
        })    
    },100);

    test('no audio sent when microphone is stopped', () => {
            return new Promise(function(resolve,reject) {
                mqtt.connect(config).then(function(mqttClient) {
                    mqttClient.publish('hermod/jest/microphone/start',null);
                    mqttClient.publish('hermod/jest/microphone/stop',null);
                    setTimeout(function() {
                        mqttClient.subscribe('hermod/jest/microphone/audio')
                        mqttClient.on('message', function(message,body) {
                            if (message == 'hermod/jest/microphone/audio') {
                                mqttClient.unsubscribe('hermod/jest/microphone/audio')
                                reject()
                            }
                        });
                        timeout = setTimeout(function() {
                            mqttClient.unsubscribe('hermod/jest/microphone/audio')
                            resolve()
                        },400)
                    },500)
                })
            })    
    },1100);



////////////////////
 ////TTS
 ////THESE TEST REQUIRE UNDERLYING TTS AND AUDIO SERVICES
////////////////////////

 //////TODO test stop and volume and mp3 play
//test('tts generates and plays audio', () => {
    //let started = false;
    //let played = false;
    //return new Promise(function(resolve,reject) {
        //mqtt.connect(config).then(function(mqttClient) {
            //mqttClient.subscribe('hermod/jest/tts/#')
            //mqttClient.subscribe('hermod/jest/speaker/#')
            //mqttClient.on('message', function(message,body) {
                ////console.log('TTS message')
                ////console.log(message)
                
                //if (message.indexOf("hermod/jest/speaker/play") == 0 && body && body.length > 0) {
                    ////console.log('SET PLAYED' )
                    //played = true;
                //}
                //if (message == "hermod/jest/tts/started") {
                    ////console.log('SET STARTED' )
                    //started = true;
                //}
                ////(started && played) && 
                //if ((message == "hermod/jest/tts/finished")) {
                    ////console.log('SET FINISHED' )
                    //mqttClient.unsubscribe('hermod/jest/tts/#')
                    //mqttClient.unsubscribe('hermod/jest/speaker/#')
                    //resolve()
                //} 
            //});
            //setTimeout(function() { mqttClient.publish('hermod/jest/tts/say',JSON.stringify({text: 'hello world'}))},500)
        //})
    //})    
//},3000);


////////////////////////////////
 //////////////Dialog Manager
 //////////////THESE TESTS REQUIRE UNDERLYING SERVICES AUDIO/HOTWORD/ASR AS WELL AS DIALOGMANAGER
 //////////////hotword/detected => dialog/end then wait dialog/ended then dialog/started, microphone/start, asr/start
 //////////////dialog/start => if text then dialog/started, asr/stop, nlu/parse ELSE  dialog/started, microphone/start, asr/start
 //////////////dialog/continue => if text then tts/say then wait tts/finished then  microphone/start, asr/start    ELSE microphone/start, asr/start
 //////////////asr/text => asr/stop, hotword/stop, microphone/stop, nlu/parse
 //////////////nlu/intent => intent
 //////////////nlu/fail => dialog/end
 //////////////dialog/end => dialog/ended, microphone/start, hotword/start
 //////////////router/action => action




//test('dialog continue with text', () => {
    //return new Promise(function(resolve,reject) {
        //mqtt.connect(config).then(function(mqttClient) {
           //// console.log('START TEST')
            //mqttClient.subscribe('hermod/jest/dialog/started')
            //mqttClient.subscribe('hermod/jest/nlu/parse')
            //// stage 2
            //mqttClient.subscribe('hermod/jest/tts/say')
            //mqttClient.subscribe('hermod/jest/tts/finished')
            //mqttClient.subscribe('hermod/jest/microphone/start')
            //mqttClient.subscribe('hermod/jest/asr/start')
            //let micStarted = false;
            //let ttsFinished = false;
            //let ttsSay = false;
                
            //mqttClient.on('message', function(message,body) {
               //// console.log('MESSAGE '+ message)
                ////console.log(message)
                ////console.log(body)
                
                ////if (message=='hermod/jest/dialog/started') {
                  //////  console.log('started')
                    ////try {
                        ////let b = JSON.parse(body)
                        ////dialogId = b.id;
                    ////} catch(e) {} 
                    ////if (!dialogId) reject('no dialog id in started message')
                ////}
                //if (message=='hermod/jest/nlu/parse') { // && dialogId > 0
                 ////   console.log('saw parse now continue')
                    //mqttClient.unsubscribe('hermod/jest/dialog/started')
                    //mqttClient.unsubscribe('hermod/jest/nlu/parse')
                    //// now try to continue the dialog using the id
                   ////console.log('DIALOG ID')
                   //// console.log(dialogId);
                    //mqttClient.publish('hermod/jest/dialog/continue',JSON.stringify({text:'thank you'}))
                    
                //} 
                //if (message=='hermod/jest/tts/say') {
                    ////console.log('say')
                    //ttsSay = true;
                //}
                //if (message=='hermod/jest/tts/finished'  && ttsSay) {
                   //// console.log('tts finish')
                    //ttsFinished = true;
                //}
                //if (message=='hermod/jest/microphone/start' && ttsFinished && ttsSay) {
                   //// console.log('start mic')
                    //micStarted = true;
                //}
                
                //if (message=='hermod/jest/asr/start' && micStarted && ttsFinished && ttsSay) {
                    ////console.log('start ASR DONE')
                    //resolve();
                //} 
                
            //});
            ////console.log('PUBLISH START')
            //mqttClient.publish('hermod/jest/dialog/start',JSON.stringify({text:'hello world'}))
        //})
    //})
//},2000);


//test('dialog continue without text', () => {
    //return new Promise(function(resolve,reject) {
        //mqtt.connect(config).then(function(mqttClient) {
            //console.log('START TEST')
            //mqttClient.subscribe('hermod/jest/dialog/started')
            //mqttClient.subscribe('hermod/jest/nlu/parse')
            //// stage 2
            //mqttClient.subscribe('hermod/jest/tts/say')
            //mqttClient.subscribe('hermod/jest/tts/finished')
            //mqttClient.subscribe('hermod/jest/microphone/start')
            //mqttClient.subscribe('hermod/jest/asr/start')
            ////let dialogId = null;
            //let micStarted = false;
            //let ttsFinished = false;
            //let ttsSay = false;
                
            //mqttClient.on('message', function(message,body) {
                //console.log('MESSAGE '+ message)
                ////console.log(message)
                ////console.log(body)
                
                ////if (message=='hermod/jest/dialog/started') {
                    ////console.log('started')
                    ////try {
                        ////let b = JSON.parse(body)
                        ////dialogId = b.id;
                    ////} catch(e) {} 
                    ////if (!dialogId) reject('no dialog id in started message')
                ////}
                //if (message=='hermod/jest/nlu/parse') { // && dialogId > 0
                    //console.log('saw parse now continue')
                    //mqttClient.unsubscribe('hermod/jest/dialog/started')
                    //mqttClient.unsubscribe('hermod/jest/nlu/parse')
                    //// now try to continue the dialog using the id
                    ////console.log('DIALOG ID')
                    ////console.log(dialogId);
                    //mqttClient.publish('hermod/jest/dialog/continue',JSON.stringify({text:''}))
                    
                //} 
                //if (message=='hermod/jest/microphone/start') {
                    //console.log('start mic')
                    //micStarted = true;
                //}
                
                //if (message=='hermod/jest/asr/start' && micStarted) {
                    //console.log('start ASR DONE')
                    //resolve();
                //} 
                
            //});
            //console.log('PUBLISH START')
            //mqttClient.publish('hermod/jest/dialog/start',JSON.stringify({text:'hello world'}))
        //})
    //})
//},200);



//test('dialog nlu/intent', () => {
    //return new Promise(function(resolve,reject) {
        //payload = {a:1,b:2}
        //mqtt.connect(config).then(function(mqttClient) {
            //mqttClient.subscribe('hermod/jest/intent')
            //mqttClient.on('message', function(message,body) {
                //if (message=='hermod/jest/intent') {
                    //if (JSON.stringify(JSON.parse(body.toString())) == JSON.stringify(payload)) {
                        //mqttClient.unsubscribe('hermod/jest/intent')
                        //resolve()
                    //} else {
                        //console.log('BROKEN PAYLOAD PASS ON NLU/INTENT')
                    //}
                //} 
            //});
            //mqttClient.publish('hermod/jest/nlu/intent',JSON.stringify(payload))
        //})
    //})    
//},100);





//test('dialog router/action', () => {
    //return new Promise(function(resolve,reject) {
        //payload = {a:1,b:2}
        ////console.log('PL')
        ////console.log(payload)
        //mqtt.connect(config).then(function(mqttClient) {
            //mqttClient.subscribe('hermod/jest/action')
            //mqttClient.on('message', function(message,body) {
                //if (message=='hermod/jest/action') {
                    ////console.log('BDY')
                    ////console.log(body.toString())
                    //if (JSON.stringify(JSON.parse(body.toString())) == JSON.stringify(payload)) {
                        //mqttClient.unsubscribe('hermod/jest/action')
                        //resolve(message)
                    //} else {
                        //reject('BROKEN PAYLOAD PASS ON ROUTER/ACTION')
                    //}
                //} 
            //});
            //mqttClient.publish('hermod/jest/router/action',JSON.stringify(payload))
        //})
    //})    
//},100);

 
//test('dialog asr/text', () => {
    //let asrStop = false;
    //let hotwordStop = false;
    //let microphoneStop = false;
    //return new Promise(function(resolve,reject) {
        //mqtt.connect(config).then(function(mqttClient) {
            //mqttClient.subscribe('hermod/jest/asr/stop')
            //mqttClient.subscribe('hermod/jest/hotword/stop')
            //mqttClient.subscribe('hermod/jest/microphone/stop')
            //mqttClient.subscribe('hermod/jest/nlu/parse')
            
            //mqttClient.on('message', function(message,body) {
                //if (message=='hermod/jest/hotword/stop') hotwordStop = true;
                //if (message=='hermod/jest/asr/stop' ) asrStop = true
                //if (message=='hermod/jest/microphone/stop' ) microphoneStop = true
                //console.log(['MESSAGE',asrStop,hotwordStop,microphoneStop,message,body])
                //if (message=='hermod/jest/nlu/parse'  && asrStop && hotwordStop && microphoneStop) {
                    //mqttClient.unsubscribe('hermod/jest/asr/stop')
                    //mqttClient.unsubscribe('hermod/jest/hotword/stop')
                    //mqttClient.unsubscribe('hermod/jest/microphone/stop')
                    //resolve()
                //} 
            //});
            //mqttClient.publish('hermod/jest/asr/text',JSON.stringify({text:'what is the time'}))
        //})
    //})    
//},200);

////////////////////////////////
//test('dialog nlu/fail', () => {
    //return new Promise(function(resolve,reject) {
        //mqtt.connect(config).then(function(mqttClient) {
            //mqttClient.subscribe('hermod/jest/dialog/end')
            //mqttClient.on('message', function(message,body) {
                //if (message=='hermod/jest/dialog/end') {
                    //mqttClient.unsubscribe('hermod/jest/dialog/end')
                    //resolve()
                //} 
            //});
            //mqttClient.publish('hermod/jest/nlu/fail',JSON.stringify({}))
        //})
    //})    
//},100);


//test('dialog dialog/end', () => {
    //let dialogEnded = false;
    //let micStarted = false;
    
    //return new Promise(function(resolve,reject) {
        //mqtt.connect(config).then(function(mqttClient) {
            //mqttClient.subscribe('hermod/jest/dialog/ended')
            //mqttClient.subscribe('hermod/jest/microphone/start')
            //mqttClient.subscribe('hermod/jest/hotword/start')
            //mqttClient.on('message', function(message,body) {
                //if (message=='hermod/jest/dialog/ended') dialogEnded = true;
                //if (message=='hermod/jest/microphone/start' && dialogEnded) micStarted = true
                //if (message=='hermod/jest/hotword/start' && dialogEnded && micStarted)  {
                    //mqttClient.unsubscribe('hermod/jest/dialog/ended')
                    //mqttClient.unsubscribe('hermod/jest/microphone/start')
                    //mqttClient.unsubscribe('hermod/jest/hotword/start')
                    //resolve()
                //} 
            //});
            //mqttClient.publish('hermod/jest/dialog/end',JSON.stringify({}))
        //})
    //})    
//},200);


//test('dialog hotword/detected', () => {
    //let ended = false;
    //let dialogStarted = false;
    //let micStarted = false;
    //return new Promise(function(resolve,reject) {
        //mqtt.connect(config).then(function(mqttClient) {
            //mqttClient.subscribe('hermod/jest/asr/start')
            //mqttClient.subscribe('hermod/jest/microphone/start')
            //mqttClient.subscribe('hermod/jest/dialog/#')
            //mqttClient.on('message', function(message,body) {
                //if (message=='hermod/jest/dialog/ended') ended = true;
                //if (message=='hermod/jest/dialog/started' && ended) dialogStarted = true
                //if (message=='hermod/jest/microphone/start' && ended && dialogStarted) micStarted = true
                //if (message=='hermod/jest/asr/start' && ended && dialogStarted && micStarted) {
                    //mqttClient.unsubscribe('hermod/jest/asr/start')
                    //mqttClient.unsubscribe('hermod/jest/microphone/start')
                    //mqttClient.unsubscribe('hermod/jest/dialog/#')
                    //resolve()
                //} 
            //});
            //mqttClient.publish('hermod/jest/hotword/detected',JSON.stringify({}))
        //})
    //})    
//},200);

//test('dialog dialog start with text', () => {
    //let dialogStarted = false;
    //let asrStopped = false;
    //let micStarted = false;
    //return new Promise(function(resolve,reject) {
        //mqtt.connect(config).then(function(mqttClient) {
            //mqttClient.subscribe('hermod/jest/dialog/started')
            //mqttClient.subscribe('hermod/jest/asr/stop')
            //mqttClient.subscribe('hermod/jest/nlu/parse')
            //mqttClient.on('message', function(message,body) {
                //if (message=='hermod/jest/dialog/started') dialogStarted = true;
                //if (message=='hermod/jest/asr/stop' && dialogStarted) asrStopped = true
                //if (message=='hermod/jest/nlu/parse' && dialogStarted && asrStopped) {
                    //mqttClient.unsubscribe('hermod/jest/dialog/started')
                    //mqttClient.unsubscribe('hermod/jest/asr/stop')
                    //mqttClient.unsubscribe('hermod/jest/nlu/parse')
                    //resolve()
                //} 
            //});
            //mqttClient.publish('hermod/jest/dialog/start',JSON.stringify({text:'hello world'}))
        //})
    //})    
//},200);

//test('dialog dialog start without text', () => {
    //let dialogStarted = false;
    //let microphoneStart = false;
    //var dialogId = null;
    //return new Promise(function(resolve,reject) {
        //mqtt.connect(config).then(function(mqttClient) {
            //mqttClient.subscribe('hermod/jest/dialog/started')
            //mqttClient.subscribe('hermod/jest/microphone/start')
            //mqttClient.subscribe('hermod/jest/asr/start')
            //mqttClient.on('message', function(message,mbody) {
                //var body = JSON.parse(mbody)
                //if (message=='hermod/jest/dialog/started') {
                    //dialogStarted = true;
                //}
                //if (message=='hermod/jest/microphone/start' && dialogStarted) microphoneStart = true
                //if (message=='hermod/jest/asr/start' && dialogStarted && microphoneStart) {
                    //mqttClient.unsubscribe('hermod/jest/dialog/started')
                    //mqttClient.unsubscribe('hermod/jest/microphone/start')
                    //mqttClient.unsubscribe('hermod/jest/asr/start')
                    //resolve()
                //} 
            //});
            //mqttClient.publish('hermod/jest/dialog/start',JSON.stringify({text:''}))
        //})
    //})    
//},100);
