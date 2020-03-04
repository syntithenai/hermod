var mqtt = require('mqtt')

var mqttClient = null;   
  
function startMoscaAndConnect(config) {
	return new Promise(function(resolve,reject) {
		//mosca.startMosca().then(function() {
			mqttClient = mqtt.connect(config.server,{username:config.username,password:config.password})
			mqttClient.on('connect',function() {
				resolve(mqttClient);
			})
		//})
	})
}

function connect(config) {
	return new Promise(function(resolve,reject) {
			var mqttClient2 = mqtt.connect(config.server,{username:config.username,password:config.password})
			mqttClient2.on('connect',function() {
				resolve(mqttClient2);
			})
	})
}


function disconnect(mqttClient) {
	if (mqttClient && mqttClient.end) {
		mqttClient.end()
	}
	
	//if (mosca && mosca.stopMosca) mosca.stopMosca()
}

module.exports = {connect : connect, disconnect : disconnect, startMoscaAndConnect: startMoscaAndConnect}
