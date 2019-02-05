var HermodService = require('./HermodService')

var stream = require('stream') 
var Readable = stream.Readable;
const axios = require('axios');

class HermodRasaNluService extends HermodService  {

    constructor(props) {
        super(props);
        let that = this;
        this.props = props;
        //console.log('RAS PRROPS');
        //console.log(props);
        
        let eventFunctions = {
        // SESSION
            'hermod/+/nlu/parse' : this.sendRequest.bind(this)
        }
		
        this.manager = this.connectToManager(props.manager,eventFunctions);

    }
    
    findMatchingIntent(payload,data) {
		// bail out if no match on primary intent
		if (data.intent && data.intent.name && data.intent.name.length > 0) {
				
			if (payload.intents && payload.intents.length > 0) {
				// is primary matched intent ok with intent filters from payload 
				var found = false;
				for (i in payload.intents) {
					let intentPattern= payload.intents[i];
					let r =new RegExp(intentPattern);
					if (r.test(data.intent.name)) {
						found = true;
						break;
					}
				}
				if (found) {
					return data.intent;
				} else {
					// what about secondary matches
					if (data.intent_ranking && data.intent_ranking.length > 0) {
						for (var j in data.intent_ranking) {
							let intent = data.intent_ranking[j] 
							for (var i in payload.intents) {
								let intentPattern= payload.intents[i];
								let r =new RegExp(intentPattern);
								if (r.test(data.intent.name)) {
									return intent;
								}
							}
						}
					} else {
						return null;
					}
				}			
			} else {
				// no filter
				return data.intent;
			}
		} else {
			return null;
		}
	}
   
    sendRequest(topic,siteId,payload) {
		let that = this;
		that.sendMqtt('hermod/'+siteId+'/nlu/started',{dialogId:payload.dialogId});				
		// TODO access control check siteId against props siteId or siteIds
		axios.post(this.props.rasaServer+"/parse",{query:payload.text,project:payload.model ? payload.model : 'current',model:'nlu'})
		  .then(response => {
			//console.log('nlu response');
			//console.log(typeof response.data);
			//console.log(response.data);
			var matchingIntent = this.findMatchingIntent(payload,response.data);
			var minConfidence = that.props.minConfidence ? that.props.minConfidence : 0.3;
			//console.log('confidence');
			//console.log(['nlu response',matchingIntent.confidence,minConfidence]);
			
			if (matchingIntent && matchingIntent.confidence > minConfidence) {
				that.sendMqtt('hermod/'+siteId+'/nlu/intent',Object.assign(payload,response.data));
		    } else {
			    that.sendMqtt('hermod/'+siteId+'/nlu/fail',Object.assign(payload,response.data));	  
			}
		  })
		  .catch(error => {
			  console.log(error);
		  });
	}
    
}     
module.exports=HermodRasaNluService
 
 
//{  
  //"project": "current", 
  //"entities": [], 
  //"intent": {
    //"confidence": 0.8859233659211788, 
    //"name": "greet"
  //}, 
  //"text": "Hello", 
  //"model": "model_20190122-221408", 
  //"intent_ranking": [
    //{
      //"confidence": 0.8859233659211788, 
      //"name": "greet"
    //}, 
    //{
      //"confidence": 0.07119500061149318, 
      //"name": "affirm"
    //}, 
    //{
      //"confidence": 0.03316768068998701, 
      //"name": "thank"
    //}, 
    //{
      //"confidence": 0.0056351102824294536, 
      //"name": "bye"
    //}, 
    //{
      //"confidence": 0.004078842494911522, 
      //"name": "name"
    //}
  //]
//}
