import React, { Component } from 'react'

import {HermodLogger,HermodReactLogger,HermodReactFlatLogger,HermodReactSatellite} from 'hermod-react-satellite'

export default class App extends Component {
    
    constructor(props) {
        super(props);
        this.state={}
        this.setLogData = this.setLogData.bind(this);
        this.siteId = 'browser_demo'; //+parseInt(Math.random()*100000000,10);
        
         //
        this.logger = new HermodLogger(Object.assign({subscribe:'#',siteId:this.siteId,username:'admin',password:'admin',logAudio:true,setLogData:this.setLogData},props));
  
        /**
         *  INTENT examples from meeka@home 
         * !! Note that intent functions are bound to the HermodReactAppServer class to supply "this" context
         * !! Note that intent functions return a promise
         */
         
        this.intents = {
            'syntithenai:open_window': function(payload) {
                let that = this;
                return new Promise(function(resolve,reject) {
                    let slots = that.cleanSlots(payload.slots)
                    console.log(slots,that);
                    that.logger.say(payload.siteId,'open window '+ slots.search_topic.value);
                    resolve();
                });
            },
            'syntithenai:close_window': function(payload) {
                let that = this;
                return new Promise(function(resolve,reject) {
                    let slots = that.cleanSlots(payload.slots)
                    console.log(slots,that);
                    that.logger.say(payload.siteId,'close window '+ slots.search_topic.value)
                    resolve();
                });
            },
            'syntithenai:list_windows': function(payload) {
                let that = this;
                return new Promise(function(resolve,reject) {
                    that.logger.say(payload.siteId,'weather is eek')
                    resolve(); 
                });
            },
            'syntithenai:get_time': function(payload) {
                let that = this;
                return new Promise(function(resolve,reject) {
                    let now = new Date();
                    let minutes = now.getMinutes();
                    let hours = now.getHours();
                    let amPm = hours > 11 ? 'PM' : 'AM';
                    hours = hours % 12;
                     if (minutes < 10) {
                        minutes = "0" + minutes;
                    }
                    that.logger.say(payload.siteId,'The time is '+hours+ ':' + minutes + ' ' + amPm);
                    resolve();
                });
            },
            'syntithenai:get_date': function(payload) {
                let that = this;
                return new Promise(function(resolve,reject) {
                    let now = new Date();
                    let months=['January','February','March','April','May','June','July','August','September','October','November','December']
                    let day = now.getDate   ();
                    let month = months[now.getMonth()];
                    let year = now.getFullYear();
                    that.logger.say(payload.siteId,'The date is '+day+ ' ' + month + ' ' + year);
                    resolve();  
                });
            },
        }
    
    };

   
   // force update
   setLogData(sites,messages,sessionStatus,sessionStatusText,hotwordListening,audioListening) {
        this.setState( this.state );
   };
   
    startWaiting() {
        if (!this.state.waiting) this.setState({waiting:true});
    };
    
    stopWaiting() {
        if (this.state.waiting)  this.setState({waiting:false});
    };
    
       
    onLogin(user,token) {
       // console.log(['ONLOGIN',user,token]);
        this.setState({user:user,token:token});
    };
    
    onLogout() {
       // console.log(['ONLOGout']);
        this.setState({user:null,token:null});
    };
 
          
                  
  render () {
    return (
        <div>
             <HermodReactSatellite logger={this.logger} siteId={this.siteId} intents={this.intents} />
           
             <br/><br/><br/><br/><br/><br/><br/>
             <hr/>
            <HermodReactLogger logger={this.logger} {...this.logger.state} siteId={null}/>
            <hr/>
            <HermodReactFlatLogger logger={this.logger} {...this.logger.state} siteId={null}/>
            
        </div>
    )
  }
}
