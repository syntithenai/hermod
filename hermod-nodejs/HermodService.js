var HermodSubscriptionManager = require('./HermodSubscriptionManager')

class HermodService {
    
    constructor(props) {
		this.props = props;
        this.manager = null;
    };
    
    connectToManager(manager,eventFunctions) {
		if (manager) {
			// don't bother capturing callback ids because this function is only called once when service is constructed and
			// subscriptions added at construction are for the life of the service (so no need to remove by id later)
            setTimeout(function() {
				manager.addCallbacks(eventFunctions);
            },300);
            this.manager = manager;
            return this.manager;
        } else {
		    this.manager =  new HermodSubscriptionManager(Object.assign({ eventCallbackFunctions :eventFunctions},this.props));
            return this.manager;
        }
    };
    
    /** 
     * Subscribe callback functions with the manager and return the callbackIds
     * as reference in case of the need to remove callback (by id)
     */
    queueOneOffCallbacks(eventFunctions) {
        if (this.manager) {
            return this.manager.addCallbacks(eventFunctions,true);
        }  else {
			console.log('queueOneOffCallbacks not loaded yet');
		}
        return [];
    };
   
    sendMqtt(destination,payload) {
        if (this.manager) {
            this.manager.sendMqtt(destination,payload);
        }  else {
			console.log('sendMqtt not loaded yet');
		}
    }; 
    
}

module.exports = HermodService
