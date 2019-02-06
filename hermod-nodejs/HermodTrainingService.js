var HermodService = require('./HermodService')

			
class HermodTrainingService extends HermodService {

    constructor(props) {
        super(props ? props : {});
        let that = this;
        if (!this.props.siteId || this.props.siteId.length === 0) {
            throw "Training service must be configured with a siteId property";
        }
        // Create a volume instance
        this.reader = null;
		this.volume = new volume();
		this.setVolume(props.volume ? props.volume : 1)	
        let eventFunctions = {
            'hermod/+/training/start' : function(topic,siteId,payload) {
				that.sendMqtt("hermod/"+siteId+"/training/started",{});
				that.startTraining(topic,siteId,payload).then(function() {
					that.sendMqtt("hermod/"+siteId+"/training/finished",{}); 
				}); 
            }
        } 
        this.manager = this.connectToManager(props.manager,eventFunctions);
    }  
   
    startTraining(topic,siteId,payload) {
		return new Promise(function(resolve,reject) {
			console.log(['START TRAINING',topic,siteId,payload]);
			
			
			
			
			resolve();
		});
	}
    
    
}
module.exports = HermodTrainingService
