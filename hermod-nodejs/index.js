var config = require('./config')
// ensure siteId
config.siteId = config.siteId ? config.siteId :  'site'+parseInt(Math.random()*100000000,10);
        
var HermodSubscriptionManager = require('./HermodSubscriptionManager')
var manager = new HermodSubscriptionManager({siteId:config.siteId});
manager.mqttConnect().then(function() {
	// Require then instantiate each service key passing contained properties to constructor
	Object.keys(config.services).map(function(serviceKey) {
		var classRef = null;
		// allow for explicit require path to service implementation
		if (config.services[serviceKey].require) {
			classRef = require(config.services[serviceKey].require);
		} else {
			classRef = require('./' + serviceKey);
		}
		var h = new classRef(Object.assign(config.services[serviceKey],{manager:manager,siteId:config.siteId}));	// override siteId,logger
	})	
})
