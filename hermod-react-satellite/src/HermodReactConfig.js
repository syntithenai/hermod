import React, { Component } from 'react'
import HermodReactComponent from './HermodReactComponent'
import AudioMeter from './AudioMeter.react'

export default class HermodReactConfig extends HermodReactComponent  {

    constructor(props) {
        super(props);
        if (!props.siteId || props.siteId.length === 0) {
            throw "Config must be configured with a siteId property";
        }
        
        let that = this;
        let eventFunctions = {
       
        }
        this.hideConfig = this.hideConfig.bind(this);
        this.logger = this.connectToLogger(props.logger,eventFunctions);
        this.resetConfig = this.resetConfig.bind(this);
    }  
    
       /**
     * Activate on mount if user has previously enabled.
     */ 
    componentDidMount() {
        //this.initSpeechSynthesis.bind(this)();
        this.loadSpeechSynthesisVoices.bind(this)();
        
        // if previously activated, restore microphone
        //if (localStorage.getItem(this.appendUserId('Hermodmicrophone_enabled',this.props.user)) === 'true') {
            //this.activate(false);
        //}
        
    }
       
    /**
     * Send Mqtt message to end the session immediately
     */ 
    sendTestSay(e) {
         e.preventDefault();
         let that = this;
        this.sendMqtt("hermod/tts/say",{siteId:this.props.siteId,text:'This is a test to hear how I speak.'});
    };
    
    resetConfig(e) {
        e.preventDefault();
        let newConfig = this.getDefaultConfig();        
        this.setState({'config':newConfig});
        localStorage.setItem(this.appendUserId('Hermodmicrophone_config',this.props.user),JSON.stringify(newConfig));
        if (this.props.configurationChange) this.props.configurationChange(newConfig);
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
    
    appendUserId(text,user) {
        if (user && user._id) {
            return text+"_"+user._id;
        } else {
            return text;
        }
    };
   
    configurationChange(e) {
        let that = this;
        //console.log(['configurationChange',this,e,e.target.value,e.target.id]);
        let config = this.props.config;
        config[e.target.id] = e.target.value;
        this.setState({config:config});
        // set silence threshhold directly
        if (e.target.id === "inputvolume" ) {
            // update all input gain nodes
            this.props.inputGainNodes.map(function(node) {
                //console.log(['set gain',node,that.props.config.inputvolume/100]);
                node.gain.value = that.props.config.inputvolume/100;
            });
            
        }
        localStorage.setItem(this.appendUserId('Hermodmicrophone_config',this.props.user),JSON.stringify(config));
        if (this.props.configurationChange) this.props.configurationChange(this.props.config);
    };


    loadSpeechSynthesisVoices() {
        let that = this;
        if ('speechSynthesis' in window) {
            // Fetch the list of voices and populate the voice options.
            function loadVoices() {
              // Fetch the available voices.
                var voices = speechSynthesis.getVoices();
              
              // Loop through each of the voices
                let voiceOptions=[];
                voices.forEach(function(voice, i) {
                // Create a new option element.
                    voiceOptions.push({'name':voice.name,label:voice.name});
                });
                voiceOptions.push({'name':'default',label:'Browser Generated'});
                that.setState({voices:voiceOptions});
                //console.log(['VOICES a',voiceOptions]);
            }

            // Execute loadVoices.
            loadVoices();

            // Chrome loads voices asynchronously.
            window.speechSynthesis.onvoiceschanged = function(e) {
              loadVoices();
            };
            
        } else {
            let voiceOptions=[];
            voiceOptions.push({'name':'default',label:'Browser Generated'});
            that.setState({voices:voiceOptions});
        }
       // console.log(['LOADED VOICES',this.state.voices]);
    };
    
    hideConfig() {
        if (this.props.hideConfig) this.props.hideConfig();
    };
   
   
    render() {
        let voiceOptions = this.state.voices && this.state.voices.map(function(voice) {
            return <option key={voice.name} value={voice.name}>{voice.label}</option>
        });
        
        
    let resetIcon = 
<svg aria-hidden="true" style={{height:'1.1em'}}  role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M500.333 0h-47.411c-6.853 0-12.314 5.729-11.986 12.574l3.966 82.759C399.416 41.899 331.672 8 256.001 8 119.34 8 7.899 119.526 8 256.187 8.101 393.068 119.096 504 256 504c63.926 0 122.202-24.187 166.178-63.908 5.113-4.618 5.354-12.561.482-17.433l-33.971-33.971c-4.466-4.466-11.64-4.717-16.38-.543C341.308 415.448 300.606 432 256 432c-97.267 0-176-78.716-176-176 0-97.267 78.716-176 176-176 60.892 0 114.506 30.858 146.099 77.8l-101.525-4.865c-6.845-.328-12.574 5.133-12.574 11.986v47.411c0 6.627 5.373 12 12 12h200.333c6.627 0 12-5.373 12-12V12c0-6.627-5.373-12-12-12z"></path></svg>
    
      
        let inputStyle={marginBottom:'0.5em',fontSize:'0.9em'};
        let config = this.props.config;
        return (
          <div >
           {<div style={{minHeight:'25em' ,margin:'1em',padding:'1em',width:'90%' ,border: '2px solid black',borderRadius:'10px',backgroundColor:'white',zIndex:'9'}}>
               <button style={{float:'right',fontSize:'1.6em',fontWeight:'bold',border: '2px solid black',borderRadius:'50px'}} onClick={this.hideConfig}>X</button>
               
               <div style={{float:'left',marginRight:'2em'}} >
                    {(status >= 2) && <span  onClick={this.deactivate}><button className='btn btn-danger' style={{fontSize:'1.5em'}}> {stopIcon2} Disable </button></span>} 
                    </div>
               
               <h1 >Microphone Configuration</h1>
                
               <form style={{fontSize:'1.8em'}}>
                    <div style={{clear:'both', width:'100%'}}>
                        <div style={{float:'right'}} >
                            <AudioMeter  inputvolume={this.props.config.inputvolume} addInputGainNode={this.props.addInputGainNode}  source={this.source}  style={{float:'right',marginRight:"2em",height:'200',width:'50',dtooLoudColor:"#FF9800",scolor:'#889bd8',border:'1px solid black',backgroundColor:'lightgrey'}} />
                        
                        </div>
                        <div style={{width:'80%'}}>
                            <div className='form-group' >
                                <b style={{marginBottom:'0.8em'}} >Volume&nbsp;&nbsp;&nbsp;</b>
                            </div> 
                            
                            <div className='form-group' >
                                <label htmlFor="inputvolume" >Microphone </label>
                                <input type="range" id="inputvolume" value={config.inputvolume} onChange={this.configurationChange.bind(this)} style={Object.assign({width:'80%'    },inputStyle)} min="0" max="200" ></input>
                            </div> 
                                            
                            <div className='form-group' >
                                <label htmlFor="outputvolume" >Output </label>
                                <input type="range" id="outputvolume" value={config.outputvolume} onChange={this.configurationChange.bind(this)} style={Object.assign({width:'80%'},inputStyle)}  ></input>
                            </div> 
                            <div className='form-group' >
                                <label htmlFor="voicevolume" >Voice </label>
                                <input type="range" id="voicevolume" value={config.voicevolume} onChange={this.configurationChange.bind(this)} style={Object.assign({width:'80%'},inputStyle)}  ></input>
                            </div> 
                        </div> 
                    </div>                    
                   
                    <div style={{clear:'both', width:'100%'}} className='form-group' >
                        <hr style={{width:'100%'}}/ >
                    </div>
                                    
                    <div className='form-group' >
                        <label htmlFor="hotword" >Hotword </label>
                        <select style={inputStyle} id="hotword" value={config.hotword} onChange={this.configurationChange.bind(this)}  ><option value="browser:ok lamp" >OK Lamp (Browser)</option><option value="browser:navy blue" >Navy Blue (Browser)</option><option value="disabled" >Disabled</option></select>
                    </div> 
                   <div className='form-group' >
                        <label htmlFor="hotwordsensitivity" >Hotword Sensitivity </label>
                        <input type="range" id="hotwordsensitivity" value={config.hotwordsensitivity} onChange={this.configurationChange.bind(this)}  style={Object.assign({width:'80%'},inputStyle)}  ></input>
                    </div> 
                     
                     <div className='form-group' >
                        <hr style={{width:'100%'}}/ >
                    </div>
                    <div className='form-group' >
                        <b style={{marginBottom:'0.8em'}}>Notifications&nbsp;&nbsp;&nbsp;</b>
                    </div> 
                    
                    <div className='form-inline' >
                        <label htmlFor="enabletts" > Voice </label>
                        <select style={inputStyle} id="enabletts" value={config.enabletts} onChange={this.configurationChange.bind(this)}  ><option value="yes" >Yes</option><option value="no" >No</option></select>
                        <label htmlFor="enableaudio" > Audio </label>
                        <select style={inputStyle}  id="enableaudio" value={config.enableaudio} onChange={this.configurationChange.bind(this)} ><option value="yes" >Yes</option><option value="no" >No</option></select>
                        <label htmlFor="enablenotifications" > Screen </label>
                        <select style={inputStyle}  id="enablenotifications" value={config.enablenotifications} onChange={this.configurationChange.bind(this)}  ><option value="yes" >Yes</option><option value="no" >No</option></select>
                    </div> 
                   
                   
                    <div className='form-group' >
                        <hr style={{width:'100%'}}/ >
                    </div>
                    <div className='form-inline' >
                        <label htmlFor="ttsvoice" >Voice </label>
                        <select style={inputStyle}  id="ttsvoice" value={config.ttsvoice} onChange={this.configurationChange.bind(this)}   >{voiceOptions}</select>
                        &nbsp;&nbsp;&nbsp;<button className='btn btn-success' style={{fontSize:'1em'}} onClick={this.sendTestSay.bind(this)}>Test</button>
                    </div> 
                    <div className='form-group' >
                        <label htmlFor="voicerate" >Rate </label>
                        <input type="range" id="voicerate" value={config.voicerate} onChange={this.configurationChange.bind(this)} style={Object.assign({width:'80%'},inputStyle)}  ></input>
                    </div> 
                    <div className='form-group' >
                        <label htmlFor="voicepitch" >Pitch </label>
                        <input type="range" id="voicepitch" value={config.voicepitch} onChange={this.configurationChange.bind(this)} style={Object.assign({width:'80%'},inputStyle)}  ></input>
                    </div> 
                   
                   
                     <div className='form-group' >
                        <hr style={{width:'100%'}}/ >
                        <span  onClick={this.resetConfig}><button className='btn btn-danger' style={{fontSize:'1em'}}> {resetIcon} Reset Configuration</button></span>
                        <hr style={{width:'100%'}}/ >
                    </div>
                  
                    
                    
                    <div className='form-group' >
                        <br/>
                        <br/><br/>
                    </div> 
                
                    
               </form>
                
                
            </div>}
            </div>
        )
    };

  
}

//<option value="server:heyHermod" >Hey Hermod (Server)</option>
