var config = require('./config')
// ensure siteId
config.siteId = config.siteId ? config.siteId :  'site'+parseInt(Math.random()*100000000,10);
    
console.log('mosca')
if (!config.mqttServer) {
	require('./mosca/index.js')    
}
console.log(config.mqttServer)
    
var HermodSubscriptionManager = require('./src/HermodSubscriptionManager')
var manager = new HermodSubscriptionManager({siteId:config.siteId,username:config.username,password:config.password,allowedSites:config.allowedSites,mqttServer:config.mqttServer});
manager.mqttConnect().then(function() {
console.log('OManager created')
		
	// Require then instantiate each service key passing contained properties to constructor
	Object.keys(config.services).map(function(serviceKey) {
		var classRef = null;
		// allow for explicit require path to service implementation
		if (config.services[serviceKey].require) {
			classRef = require(config.services[serviceKey].require);
		} else {
			classRef = require('./src/' + serviceKey);
		}
		console.log('IManager ')
		console.log(classRef)
		var imanager = new HermodSubscriptionManager({siteId:config.siteId,username:config.username,password:config.password,allowedSites:config.allowedSites,mqttServer:config.mqttServer});
		imanager.mqttConnect().then(function() {

			var h = new classRef(Object.assign(config.services[serviceKey],{manager:imanager,siteId:config.siteId}));	// override siteId,logger
		});
	})	
})

 
