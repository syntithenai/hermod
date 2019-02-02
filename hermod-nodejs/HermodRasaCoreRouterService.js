var HermodService = require('./HermodService')

var stream = require('stream') 
var Readable = stream.Readable;
const axios = require('axios');

class HermodRasaCoreRouterService extends HermodService  {

    constructor(props) {
        super(props);
        let that = this;
        this.props = props;
        //console.log('RAS PRROPS');
        //console.log(props);
        this.recursionDepth={};
        let eventFunctions = {
        // SESSION
            'hermod/+/intent' : this.sendRequest.bind(this)
        }
		
        this.manager = this.connectToManager(props.manager,eventFunctions);

    }
 
	
	predictAndRun (siteId)  {
		let that = this;
		//console.log('predict and run');
		return new Promise(function(resolve,reject) {
			axios.post(that.props.coreServer+"/conversations/"+siteId+"/predict",{})
			.then(response => {
			   //console.log('posted predict response');
				//console.log(response.data);
				if (response.data.scores && response.data.scores.length > 0 && response.data.scores[0].action  && response.data.scores[0].action.length > 0) {
					let scores = response.data.scores;
					scores.sort(function(a,b) {
						if (a.score > b.score) return -1
						else return 1;
					});
					//console.log('===========================1');
					//console.log(scores);
					//console.log('===========================1');
					let action =  scores[0].action;
					console.log(['ACTION',action]);
					// get current state of slots for action message
					axios.get(that.props.coreServer+"/conversations/"+siteId+"/tracker",{})
					  .then(tracker => {

					
     					that.sendMqtt('hermod/'+siteId+'/action',{action:action,slots:tracker.data.slots});
						console.log(['send action message '+action,{action:action,slots:tracker.data.slots}])

						axios.post(that.props.coreServer+"/conversations/"+siteId+"/tracker/events",{event:'action',name:action})
					  .then(response => {
							//console.log('sent action event to tracker')
							//console.log(response.data)
							axios.post(that.props.coreServer+"/conversations/"+siteId+"/predict",{})
							.then(response => {
								//console.log('next action')
								//console.log(response.data)
								let scores = response.data.scores;
								if (scores.length > 0) {
									scores.sort(function(a,b) {
										if (a.score > b.score) return -1
										else return 1;
									});			
									if (scores[0].action === "action_listen") {
										resolve();
									} else {
										that.recursionDepth[siteId]++;
										// avoid infinite recursion if getting garbage from core
										if (that.recursionDepth[siteId] > 10) {
											resolve();
										} else {
											that.predictAndRun(siteId).then(function(action) {
												resolve();
											});
										}
									}						
										

								}
							}).catch(error => {
								  console.log(error);
							  });;
					
					  }).catch(error => {
						  console.log(error);
					  });						  
					});
						
				}			
		   });
		  });
	  }
 
    sendRequest(topic,siteId,payload) {
		let that = this;
		this.recursionDepth[siteId] = 0;
		that.sendMqtt('hermod/'+siteId+'/conversations/core/started',{dialogId:payload.dialogId});				
		// TODO access control check siteId against props siteId or siteIds
		console.log('post message ');
		axios.post(this.props.coreServer+"/conversations/"+siteId+"/messages",{text:payload.text,sender:"user",parse_data:payload})
		  .then(function(response) {
			  console.log('posted message response');
			//	console.log(response.data);
			that.predictAndRun(siteId).then(function(a) {
				console.log(['NOW LISTEN',a]);
			  });
		  })
		  .catch(error => {
			  console.log(error);
		  });
	}
    
}     
module.exports=HermodRasaCoreRouterService
 
 