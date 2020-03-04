var mqtt = require("./mqttconnect");
var config = require('./config')


function setupTests()  {
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
}

module.exports = setupTests
