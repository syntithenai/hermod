var mqtt = require("./mqttconnect");
var config = require('./config')
var wav2mqtt = require('./wav2mqtt')
var mqtt2wav = require('./mqtt2wav')

var fs = require('fs')
var timeout = null;
beforeAll(() => {
	return new Promise(function(resolve,reject) {
		// startup mqtt
		mqtt.startMoscaAndConnect(config).then(function(client) {
			var mqttClient = client
			// start services
			        
			var HermodSubscriptionManager = require('../src/HermodSubscriptionManager')
			var manager = new HermodSubscriptionManager({siteId:config.siteId,username:config.username,password:config.password,allowedSites:config.allowedSites,mqttServer:config.mqttServer});
			manager.mqttConnect().then(function() {
				//console.log('subs manager connected')
				let promises = [];
				// Require then instantiate each service key passing contained properties to constructor
				//console.log('subs manager services')
				//console.log([config.services])
				Object.keys(config.services).map(function(serviceKey) {
					let p = new Promise(function(iresolve,ireject) {
						var classRef = null;
						// allow for explicit require path to service implementation
						if (config.services[serviceKey].require) {
							classRef = require(config.services[serviceKey].require);
						} else {
							classRef = require('../src/' + serviceKey);
						}
						//console.log('subs inner manager connect '+serviceKey)
				
						var imanager = new HermodSubscriptionManager({siteId:config.siteId,username:config.username,password:config.password,allowedSites:config.allowedSites,mqttServer:config.mqttServer});
						imanager.mqttConnect().then(function() {
							//console.log('subs inner manager connected')
				
							var h = new classRef(Object.assign(config.services[serviceKey],{manager:imanager,siteId:config.siteId}));	// override siteId,logger
							iresolve();
						});
					})
					promises.push(p)
				})	
				Promise.all(promises).then(function() {
					resolve()  // resolve test setup	
				})
			})
		});
	});
});

afterAll(() => {
	return new Promise(function(resolve,reject) {
		if (mqtt && mqtt.disconnect) mqtt.disconnect()
		resolve()
	})
	clearTimeout(timeout)
})

test('hotword detected', () => {
	let started = false;
	let played = false;
	return new Promise(function(resolve,reject) {
		mqtt.connect(config).then(function(mqttClient) {
			mqttClient.subscribe('hermod/jest/hotword/detected')
			mqttClient.on('message', function(message,body) {
				if (message == 'hermod/jest/hotword/detected') {
					mqttClient.unsubscribe('hermod/jest/hotword/detected')
					resolve()
				} 
			});
			mqttClient.publish('hermod/jest/hotword/activate')
			mqttClient.publish('hermod/jest/hotword/start')
			setTimeout(function() {wav2mqtt.start(mqttClient,'jest','tests/picovoice.wav') }, 3000)
		})
	})	
	
},15000);


//test('asr text detected - my name is fred', () => {
	//return new Promise(function(resolve,reject) {
		//mqtt.connect(config).then(function(mqttClient) {
			//mqttClient.subscribe('hermod/jest/asr/text')
			//mqttClient.on('message', function(message,b) {
				////console.log(message)
				////console.log(body)
				//if (message == "hermod/jest/asr/text") { 
					//let body = {}
					//try {
						//body = JSON.parse(b)
					//} catch (e) {}
					//console.log(body.text)
					//mqttClient.publish('hermod/jest/asr/deactivate')
					//mqtt2wav.stop(mqttClient,'jest');
					//resolve()
					////if (body && body.text && (body.text.trim() == 'my name is fred' )) { 
						////mqttClient.unsubscribe('hermod/jest/asr/text')
						////mqttClient.publish('hermod/jest/asr/deactivate')
						////mqtt2wav.stop(mqttClient,'jest');
						////resolve()
					////} else {
						////mqttClient.unsubscribe('hermod/jest/asr/text')
						////mqttClient.publish('hermod/jest/asr/deactivate')
						////mqtt2wav.stop(mqttClient,'jest');
						////reject()
					////} 
				//}
			//});
			//mqttClient.publish('hermod/jest/asr/activate')
			//mqtt2wav.start(mqttClient,'jest','./mynamefred.wav');
			//mqttClient.publish('hermod/jest/asr/start')
			////console.log('play bumblebee')
			//setTimeout(function() {wav2mqtt.start(mqttClient,'jest','tests/hey_edison.wav') }, 100)
		//})
	//})	
//},15000);





//// TODO test stop and volume and mp3 play
//test('speaker plays wav', () => {
	//let started = false;
	//return new Promise(function(resolve,reject) {
		//mqttClient.subscribe('hermod/jest/speaker/#')
		//mqttClient.on('message', function(message,body) {
			//if (message == "hermod/jest/speaker/started") started = true;
			//if (started && message == "hermod/jest/speaker/finished") {
				//mqttClient.unsubscribe('hermod/jest/speaker/#')
				//resolve();
			//}
		//});
		//fs.readFile('./tests/test.wav', function(err, testwav) {
			//if (err) console.log(['ERR failed to read testfile:',err])
			//mqttClient.publish('hermod/jest/speaker/play',testwav)
		//})	
	//})	
//});


//// TODO capture, check packets??
//test('microphone sends audio when started', () => {
	
	//return new Promise(function(resolve,reject) {
		//mqttClient.subscribe('hermod/jest/microphone/audio')
		//mqttClient.on('message', function(message,body) {
			//if (message == "hermod/jest/microphone/audio") {
				//mqttClient.unsubscribe('hermod/jest/microphone/#')
				//mqttClient.publish('hermod/jest/microphone/stop',null);
				//resolve()
			//}
		//});
		//mqttClient.publish('hermod/jest/microphone/start',null);
		
	//})	
//});

//test('no audio sent when microphone is stopped', () => {
		//return new Promise(function(resolve,reject) {
			//mqttClient.publish('hermod/jest/microphone/start',null);
			//mqttClient.publish('hermod/jest/microphone/stop',null);
			
			//mqttClient.subscribe('hermod/jest/microphone/audio')
			//mqttClient.on('message', function(message,body) {
				//if (message == 'hermod/jest/microphone/audio') {
					//mqttClient.unsubscribe('hermod/jest/microphone/audio')
					//reject()
				//}
			//});
			//timeout = setTimeout(function() {
				//mqttClient.unsubscribe('hermod/jest/microphone/audio')
				//resolve()
			//},400)
		//})	
//});

//// TODO test stop and volume and mp3 play
//test('tts generates and plays audio', () => {
	//let started = false;
	//let played = false;
	//return new Promise(function(resolve,reject) {
		//mqttClient.subscribe('hermod/jest/tts/#')
		//mqttClient.subscribe('hermod/jest/speaker/#')
		//mqttClient.on('message', function(message,body) {
			////console.log('message')
			////console.log(message)
			
			//if (message == "hermod/jest/speaker/play") played = true;
			//if (message == "hermod/jest/tts/started") started = true;
			//if ((started && played) && (message == "hermod/jest/tts/finished")) {
				//mqttClient.unsubscribe('hermod/jest/tts/#')
				//mqttClient.unsubscribe('hermod/jest/speaker/#')
				//resolve()
			//} 
		//});
		//mqttClient.publish('hermod/jest/tts/say',JSON.stringify({text: 'hello world'}))
	//})	
//});

//test('can stream audio file', () => {
	//let started = false;
	//let played = false;
	//return new Promise(function(resolve,reject) {
		//mqttClient.subscribe('hermod/jest/microphone/audio')
		//mqttClient.on('message', function(message,body) {
			//if (message=='hermod/jest/microphone/audio') {
				//mqttClient.unsubscribe('hermod/jest/microphone/audio')
				//resolve()
			//} 
		//});
		//wav2mqtt.start(mqttClient,'jest','tests/test.wav')		
		////mqttClient.publish('hermod/jest/tts/say',JSON.stringify({text: 'hello world'}))
	//})	
//});



