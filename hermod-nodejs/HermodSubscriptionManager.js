var HermodMqttServer = require('./HermodMqttServer')

/**
 * This class handles subscriptions and publishing to mqtt for a
 * suite of services running in the same node process.
 * Services can register subscription callbacks when constructed
 * Services can also add subscription callbacks on the fly and clean them up afterwards. 
 */
class HermodSubscriptionManager  extends HermodMqttServer {
    constructor(props) {
        super(props ? props : {});
        let that = this;
        if (!this.props.siteId || this.props.siteId.length === 0) {
            throw "Subscription manager must be configured with a siteId property";
        }
    }   
    
    afterConnect() {
		this.addCallbacks(this.props.eventCallbackFunctions);
	}
     
    /** Take an object containing callback functions keyed to mqtt topics
		- subscribe to relevant topics (allowing for siteId)
		- save callbacks for onMessageArrived
     */
    addCallbacks(eventCallbackFunctions,oneOff = false) {
        let that = this;
        let callbackIds=[]
        this.eventCallbackFunctions = Array.isArray(this.eventCallbackFunctions) ? this.eventCallbackFunctions : [];
        if (eventCallbackFunctions) {
            Object.keys(eventCallbackFunctions).map(function(key,loopKey) {
                let value = eventCallbackFunctions[key];
                if (typeof value === "function") {
                    let siteTopic = key.replace("hermod/+/","hermod/"+that.props.siteId+"/");
					// if not already subscribed, subscribe now
                    if (that.findEventCallbackFunctions(siteTopic).length === 0) {
						that.subscribe(siteTopic)
					}
					let genId = parseInt(Math.random()*100000000,10);
					callbackIds.push(genId);
					that.eventCallbackFunctions.push({subscription:siteTopic,callBack:value, oneOff: oneOff,id:genId});
                }
            });
        }
        return callbackIds;
    };
    
    
    mqttWildcard(topic, wildcard) {
        if (topic === wildcard) {
            return [];
        } else if (wildcard === '#') {
            return [topic];
        }

        var res = [];

        var t = String(topic).split('/');
        var w = String(wildcard).split('/');

        var i = 0;
        for (var lt = t.length; i < lt; i++) {
            if (w[i] === '+') {
                res.push(t[i]);
            } else if (w[i] === '#') {
                res.push(t.slice(i).join('/'));
                return res;
            } else if (w[i] !== t[i]) {
                return null;
            }
        }

        if (w[i] === '#') {
            i += 1;
        }

        return (i === w.length) ? res : null;
    }

   
    
    
    /**
     * Find all callback functions with matching subscription key 
     */
    findEventCallbackFunctions(subscriptionKey) {
        let that = this;
        let ret=[];
        this.eventCallbackFunctions.map(function(value,vkey) {
			if (that.mqttWildcard(subscriptionKey,value.subscription)) {
                ret.push(value);
                return;
            }
        });
        return ret;
    };

    /**
     * Find all callback functions with matching subscription key 
     */
    findEventCallbackFunctionById(callbackId) {
        let that = this;
        let ret=null;
        this.eventCallbackFunctions.map(function(value,vkey) {
            if (value.id === callbackId) {
                ret = value;
                return;
            }
        });
        return ret;
    };

	removeCallbackById(callbackId) {
		let that = this;
		let callback = that.findEventCallbackFunctionById(callbackId);
		if (callback) {
			var callbackDef = that.eventCallbackFunctions[callback]
			if (callbackDef) {
				that.eventCallbackFunctions.splice(callback,1);
				if (that.findEventCallbackFunctions(callbackDef.subscription).length === 0) {
					that.unsubscribe(topic)
				}
			}
		}
	}

       
    /**
     * Handle published message for all subscribed topics on all services.
     */
    onMessageArrived(topic,message) {
		let that = this;
        let parts = topic ? topic.split("/") : [];
        if (parts.length > 0 && parts[0] === "hermod") {
            // Audio Messages pass through message body direct
            if (parts.length > 3 && ((parts[2]==="speaker"&& parts[3]==="play"  ) || (parts[2]==="microphone" && parts[3]==="audio"  )) ) {
                let siteId = parts[1];
				let action = parts[3];
				let callbacks = that.findEventCallbackFunctions(topic);
				if (callbacks) {
					callbacks.map(function(value,ckey) {
						value.callBack.bind(that)(topic,siteId,message);
					});
				}	
            // Non Audio Messages parse JSON body
            } else {
				let payload = {};
                try {
                  payload = JSON.parse(message);  
                } catch (e) {
                }
				// replace siteId in incoming topic
				let parts = topic.split("/");
				let siteId = parts[1];                
				let callbacks = that.findEventCallbackFunctions(topic);
				if (callbacks) {
					callbacks.map(function(value,ckey) {
						value.callBack.bind(that)(topic,siteId,payload);
						if (value.oneOff) {
							// remove this callback
							let breakLoop = false;
							that.eventCallbackFunctions.map(function(tvalue,vkey) {
								if (value.id === tvalue.id && !breakLoop) {
									that.eventCallbackFunctions.splice(vkey,1);
									breakLoop = true;
								}
								if (that.findEventCallbackFunctions(topic).length === 0) {
									that.unsubscribe(topic)
								}
								return;
							});
						}
					});
				}
            } 
        }
    };
}
module.exports = HermodSubscriptionManager
