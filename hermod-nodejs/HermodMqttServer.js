var mqtt = require('mqtt')

class HermodMqttServer {

    constructor(props) {
		this.props = props;
		//console.log(['h mqtt server constr',props])
        this.failCount = 0;
        this.mqttClient = null;
        this.sessionId = null;
        this.clientId = props.clientId ? props.clientId :  'client'+parseInt(Math.random()*100000000,10);
        this.state={};
        this.connectTimeout = null;
        this.started = false;
        this.onMessageArrived = this.onMessageArrived.bind(this);
        this.onConnect = this.onConnect.bind(this);
        this.mqttConnect = this.mqttConnect.bind(this);    
     }   
     
     setState(newState) {
         this.state =  Object.assign(this.state,newState);
		 return this.state;
     };

    start() {
        this.started = true;
        this.mqttConnect() ;
    };
    
    stop() {
        this.started = false;
        if (this.mqttClient) this.mqttClient.disconnect() ;
    };
        
   /**
     * Connect to mqtt server
    */
    mqttConnect() {
		let that= this;
		//console.log(['hermod connect ',this.props])
        return new Promise(function(resolve,reject) {
			let server = that.props.mqttServer && that.props.mqttServer.length > 0 ? that.props.mqttServer :  "mqtt://localhost" ;
			that.mqttClient = mqtt.connect(server,{username:that.props.username,password:that.props.password})
			that.mqttClient.on('message', that.onMessageArrived);
			that.mqttClient.on('connect',function() {
				console.log(['connect']);
				that.onConnect();
				resolve();
			});
			that.mqttClient.on('error',function(e) { console.log(['ERROR',e]); reject() });
			that.mqttClient.on('reconnect',function() { console.log(['RECONNECT']) });
			
			that.mqttClient.on('offline', function(text) {
				console.log(['offline',text]);				
			})
			that.mqttClient.on('close', function(text) {
				console.log(['close',text]);				
			})
			that.mqttClient.on('end', function(text) {
				console.log(['end',text]);				
			})
			//that.mqttClient.on('packetsend', function(text) {
				//console.log(['packetsend',text]);				
			//})
			//that.mqttClient.on('packetreceive', function(text) {
				//console.log(['packetreceive',text]);				
			//})
			 
			
		})
    };
        
    /**
     * Subscribe to to mqtt channels then start recorder
     */
    onConnect() {
      let that = this;
      this.setState({'connected':true});
      this.failCount = 0;
      this.afterConnect(this);
    }
    
    subscribe(topic) {
		if (this.mqttClient) {
			this.mqttClient.subscribe(topic,{});
		} else  {
			console.log('sub not loaded yet');
		}
	};
    
    unsubscribe(topic) {
		if (this.mqttClient) {
			this.mqttClient.unsubscribe(topic,function() {});
		} else  {
			console.log('sub not loaded yet');
		}
	}
    
    // implement in extension class
    afterConnect() {
    };
     
    sendMqtt(destination,payload) {
	   if (this.mqttClient) {
			if (this.state.connected) {
				this.mqttClient.publish(destination,JSON.stringify(payload))
			}
		}
    };
    
    sendAudioMqtt(destination,payload) {
		//console.log('SEND AUDIO MQTT',destination)
        if (this.mqttClient) {
			if (this.state.connected) {
		//console.log('SEND really AUDIO MQTT',destination,payload)
        		this.mqttClient.publish(destination,payload)
			}
		}
    };
    
    /**
     * Send Mqtt message to speak text
     */ 
    say(siteId,text) {
        this.sendMqtt("hermod/"+this.props.siteId+"/tts/say",JSON.stringify({text:text}));
    };
    
    
    // implement in extension class
    onMessageArrived(topic,message) {
       // console.log(['IMPLEMENT ONMESSAGE',message]);
    }
    
}
module.exports = HermodMqttServer
