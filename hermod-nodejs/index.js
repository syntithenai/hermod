var config = require('./config')
// ensure siteId
config.siteId = config.siteId ? config.siteId :  'site'+parseInt(Math.random()*100000000,10);
        
var HermodSubscriptionManager = require('./HermodSubscriptionManager')
var manager = new HermodSubscriptionManager({siteId:config.siteId,username:config.username,password:config.password,allowedSites:config.allowedSites});
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
		var imanager = new HermodSubscriptionManager({siteId:config.siteId,username:config.username,password:config.password,allowedSites:config.allowedSites});
		imanager.mqttConnect().then(function() {

			var h = new classRef(Object.assign(config.services[serviceKey],{manager:imanager,siteId:config.siteId}));	// override siteId,logger
		});
	})	
})
	 