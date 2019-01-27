/* global Paho */

export default class HermodMqttServer {

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
        this.onConnectionLost = this.onConnectionLost.bind(this);
        this.mqttConnect = this.mqttConnect.bind(this);
        
     }   
     
     setState(newState) {
         return Object.assign(this.state,newState);
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
        let port = this.props.mqttPort && this.props.mqttPort > 0 ? parseInt(this.props.mqttPort,10) : 9001
        let server = this.props.mqttServer && this.props.mqttServer.length > 0 ? this.props.mqttServer :  window.location.hostname ;
        this.mqttClient = new Paho.MQTT.Client(server,port, this.clientId);
        this.mqttClient.onConnectionLost = this.onConnectionLost;
        this.mqttClient.onMessageArrived = this.onMessageArrived;
        this.mqttClient.connect({onSuccess:this.onConnect});
    };
        
    /**
     * Subscribe to to mqtt channels then start recorder
     */
    onConnect() {
      let that = this;
      //console.log([' SERVER CONNECTED',this.eventFunctions]);
      this.setState({'connected':true});
      this.failCount = 0;
      let subscribe = this.props.subscribe && this.props.subscribe.length  > 0 ? this.props.subscribe : '#';
      that.mqttClient.subscribe(subscribe,{});
      this.afterConnect(this);
    }
    
    afterConnect() {
       //console.log([' after CONNECTED']);
    };
 
    /**
     * When the client loses its connection, reconnect after 5s
     */ 
    onConnectionLost(responseObject) {
        let that = this;
        this.setState({'connected':false});
        if (responseObject.errorCode !== 0) {
            console.log(["  SERVER onConnectionLost:"+responseObject.errorMessage]);
            if (this.props.onConnectionLost && typeof this.props.onConnectionLost === "function") {
                this.props.onConnectionLost(this);
            } else {
                let timeout=1000;
                if (this.failCount > 5) {
                    timeout=10000;
                } else if (this.failCount > 10) {
                    timeout=30000;
                } else if (this.failCount > 15) {
                    timeout=360000;
                }
                this.failCount++;
                clearTimeout(this.connectTimeout);
                this.connectTimeout = setTimeout(function() {
                  that.mqttClient.connect({onSuccess:that.onConnect});  
                },timeout)                
            }
        }

    }
    ;
    
    
    // respond to hermod/hotword/toggleOn or toggleOff where the siteId matches props.siteId
    onMessageArrived(message) {
       // console.log(['IMPLEMENT ONMESSAGE',message]);
    }
    
}
