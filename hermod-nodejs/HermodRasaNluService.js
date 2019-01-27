var HermodService = require('./HermodService')

var stream = require('stream') 
var Readable = stream.Readable;
const axios = require('axios');

class HermodRasaNluService extends HermodService  {

    constructor(props) {
        super(props);
        let that = this;
        
        
        
        let eventFunctions = {
        // SESSION
            'hermod/#/nlu/query' : function(topic,siteId,payload) {
				that.sentMqtt('hermod/'+siteId+'/nlu/started',{dialogId:payload.dialogId});				
				// TODO access control check siteId against props siteId or siteIds
				axios.post(config.rasaServer+"/parse",{query:payload.text,project:payload.model ? payload.model : 'default'})
				  .then(response => {
					console.log(response);
					//that.sentMqtt('hermod/'+siteId+'/nlu/fail',response);
					that.sentMqtt('hermod/'+siteId+'/intent',{dialogId:payload.dialogId,intent:response.intent.name,slots:response.entities});
				  })
				  .catch(error => {
					  console.log(error);
				  });
		    }
        }
		
        this.manager = this.connectToManager(props.manager,eventFunctions);

    }
   
    
    
}     
module.exports=HermodRasaNluService
 
 
{  
  "project": "current", 
  "entities": [], 
  "intent": {
    "confidence": 0.8859233659211788, 
    "name": "greet"
  }, 
  "text": "Hello", 
  "model": "model_20190122-221408", 
  "intent_ranking": [
    {
      "confidence": 0.8859233659211788, 
      "name": "greet"
    }, 
    {
      "confidence": 0.07119500061149318, 
      "name": "affirm"
    }, 
    {
      "confidence": 0.03316768068998701, 
      "name": "thank"
    }, 
    {
      "confidence": 0.0056351102824294536, 
      "name": "bye"
    }, 
    {
      "confidence": 0.004078842494911522, 
      "name": "name"
    }
  ]
}
