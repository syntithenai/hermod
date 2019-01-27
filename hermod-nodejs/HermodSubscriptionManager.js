var HermodMqttServer = require('./HermodMqttServer')


class HermodSubscriptionManager  extends HermodMqttServer {
    constructor(props) {
        super(props ? props : {});
        let that = this;
        if (!this.props.siteId || this.props.siteId.length === 0) {
            throw "Subscription manager must be configured with a siteId property";
        }
        
        //this.mqttConnect.bind(this)() ;
    }   
    
    afterConnect() {
		//this.eventCallbackFunctions = 
        //setTimeout(function() {
			this.addCallbacks(this.props.eventCallbackFunctions);
        //},300);
        
	}
     
    /** Take an object containing callback functions keyed to mqtt topics
		- subscribe to relevant topics (allowing for siteId)
		- save callbacks for onMessageArrived
     */
    addCallbacks(eventCallbackFunctions,oneOff = false) {
		//console.log(['add callbacks ',eventCallbackFunctions])
        let that = this;
        let callbackIds=[]
        this.eventCallbackFunctions = Array.isArray(this.eventCallbackFunctions) ? this.eventCallbackFunctions : [];
        if (eventCallbackFunctions) {
            Object.keys(eventCallbackFunctions).map(function(key,loopKey) {
                let value = eventCallbackFunctions[key];
                if (typeof value === "function") {
                    let siteTopic = key.replace("hermod/#/","hermod/"+that.props.siteId+"/");
					// if not already subscribed, subscribe now
					//console.log(['try sub ',siteTopic,that.findEventCallbackFunctions(siteTopic)])
                    if (that.findEventCallbackFunctions(siteTopic).length === 0) {
						console.log(['try sub really ',siteTopic])
						that.subscribe(siteTopic)
					}
					let genId = parseInt(Math.random()*100000000,10);
					callbackIds.push(genId);
					that.eventCallbackFunctions.push({subscription:siteTopic,callBack:value, oneOff: oneOff,id:genId});
                }
            });
        }
        //console.log(that.eventCallbackFunctions);
        return callbackIds;
    };
    
    /**
     * Find all callback functions with matching subscription key 
     */
    findEventCallbackFunctions(subscriptionKey) {
        let that = this;
        let ret=[];
        this.eventCallbackFunctions.map(function(value,vkey) {
            if (value.subscription === subscriptionKey) {
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
		//console.log(['callbacks',callback])
		if (callback) {
			var callbackDef = that.eventCallbackFunctions[callback]
			//console.log(['callbacks def',callbackDef])
			if (callbackDef) {
				that.eventCallbackFunctions.splice(callback,1);
				if (that.findEventCallbackFunctions(callbackDef.subscription).length === 0) {
				//	console.log(['try unsub really '])
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
                //if (parts.length > 3) {
                    let action = parts[3];
                    //let id = parts.length > 4 ? parts[4] : ''; //this.generateUuid() ;
                    //let functionKey ='hermod/#/'+parts[2]+'/'+action;
					let callbacks = that.findEventCallbackFunctions(topic);
					if (callbacks) {
						callbacks.map(function(value,ckey) {
							value.callBack.bind(that)(topic,siteId,message);
						});
					}	
                //} 
            // Non Audio Messages parse JSON body
            } else {
				//console.log(['non audio',topic])
				let payload = {};
                try {
                  payload = JSON.parse(message);  
                } catch (e) {
                }
              //  console.log(['parse payload',payload])
				
                    // replace siteId in incoming topic
                    let parts = topic.split("/");
                    let siteId = parts[1];                
                    let callbacks = that.findEventCallbackFunctions(topic);
                    //console.log(['callbacks',topic,callbacks])
					if (callbacks) {
						callbacks.map(function(value,ckey) {
						//	console.log(['callbacks run',topic,siteId])
							value.callBack.bind(that)(topic,siteId,payload);
							if (value.oneOff) {
							//	console.log(['callbacks remove',value])
								// remove this callback
								let breakLoop = false;
								that.eventCallbackFunctions.map(function(tvalue,vkey) {
									if (value.id === tvalue.id && !breakLoop) {
										that.eventCallbackFunctions.splice(vkey,1);
										breakLoop = true;
									}
								//	console.log(['try unsub ',topic])
									if (that.findEventCallbackFunctions(topic).length === 0) {
										console.log(['try unsub really '])
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
