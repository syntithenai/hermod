import React, { Component } from 'react'

import HermodReactHotwordServer from './HermodReactHotwordServer'
import HermodReactMicrophone from './HermodReactMicrophone'
import HermodReactTts from './HermodReactTts'
import HermodReactSpeaker from './HermodReactSpeaker'
import HermodReactAppServer from './HermodReactAppServer'
import HermodReactConfig from './HermodReactConfig'


export default class HermodReactSatellite extends Component  {

    constructor(props) {
        super(props);
        this.siteId = props.siteId ? props.siteId : 'browser_'+parseInt(Math.random()*100000000,10);
        this.inputGainNodes=[];
        this.state = {showConfig:false,config:{}};
        this.setLogData = this.setLogData.bind(this);
        this.setConfig = this.setConfig.bind(this);
        this.showConfig = this.showConfig.bind(this);
        this.hideConfig = this.hideConfig.bind(this);
        this.addInputGainNode = this.addInputGainNode.bind(this);
        
        this.logger = props.logger ? props.logger : new HermodLogger(Object.assign({logAudio:false,setLogData:this.setLogData },props));
        let configString = localStorage.getItem(this.appendUserId('Hermodmicrophone_config',props.user));
        let config = null;
        try {
            config = JSON.parse(configString)
        } catch(e) {
        }
        if (config) {
            this.state.config = config;
        } else {
            // default config
            let newConfig = this.getDefaultConfig();
            this.state.config = newConfig;
            localStorage.setItem(this.appendUserId('Hermodmicrophone_config',this.props.user),JSON.stringify(newConfig));
        }
    }  
    
        
    appendUserId(text,user) {
        if (user && user._id) {
            return text+"_"+user._id;
        } else {
            return text;
        }
    };
    
    componentDidMount() {
        
    };
    
    // force update
    setLogData(sites,messages,sessionStatus,sessionStatusText,hotwordListening,audioListening) {
        this.setState(this.state);
    };
    
    setConfig(config) {
        this.setState({config:config});
    };
    
    showConfig() {
        this.setState({showConfig:true});
    };
    
    hideConfig() {
        this.setState({showConfig:false});
    };
    
    addInputGainNode(node) {
        this.inputGainNodes.push(node);
    };

     getDefaultConfig() {
        //console.log(['GDC',this.state]);
        return  {
            inputvolume:'70',
            outputvolume:'70',
            voicevolume:'70',
            ttsvoice: 'default', //this.state.voices && this.state.voices.length > 0 ? this.state.voices[0].name :
            voicerate:'50',
            voicepitch:'50',
            hotword:'browser:oklamp',
            hotwordsensitivity:'50',
            enabletts:'yes',
            enableaudio:'yes',
            enablenotifications:'yes'
        };
    };

//  
    render() {
        let position=this.props.position ? this.props.position  : 'top left'
        return <div id ="Hermodreactsatellite" >
            <HermodReactHotwordServer {...this.props}  logger={this.logger} siteId={this.siteId}  config={this.state.config}  addInputGainNode={this.addInputGainNode}/>
            <HermodReactMicrophone {...this.props} position={position} logger={this.logger} siteId={this.siteId} config={this.state.config} showConfig={this.showConfig} hideConfig={this.hideConfig} addInputGainNode={this.addInputGainNode} />
            <HermodReactTts {...this.props} logger={this.logger} siteId={this.siteId} config={this.state.config}  />
            <HermodReactSpeaker {...this.props} logger={this.logger} siteId={this.siteId}  config={this.state.config} />
            {this.props.intents && <HermodReactAppServer  {...this.props} logger={this.logger} siteId={this.siteId}  config={this.state.config}  />}
            <div style={{width:'100%',clear:'both'}}>&nbsp;</div>
          {this.state.showConfig && <HermodReactConfig  {...this.props}  setConfig={this.setConfig} configurationChange={this.setConfig} hideConfig={this.hideConfig} config={this.state.config} addInputGainNode={this.addInputGainNode} inputGainNodes={this.inputGainNodes} />}
            
        </div>
    };

  
}

