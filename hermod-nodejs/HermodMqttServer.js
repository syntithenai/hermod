var mqtt = require('mqtt')

class HermodMqttServer {

    constructor(props) {
		this.props = props;
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
        return new Promise(function(resolve,reject) {
			let server = that.props.mqttServer && that.props.mqttServer.length > 0 ? that.props.mqttServer :  "mqtt://localhost" ;
			that.mqttClient = mqtt.connect(server)
			that.mqttClient.on('message', that.onMessageArrived);
			that.mqttClient.on('connect',function() {
				that.onConnect();
				resolve();
			});
			that.mqttClient.on('error',function(e) { console.log(['ERROR',e]); reject() });
			that.mqttClient.on('reconnect',function() { console.log(['RECONNECT']) });
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
        if (this.mqttClient) {
			if (this.state.connected) {
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
