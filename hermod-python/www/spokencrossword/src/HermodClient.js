/* global window */

import React from 'react';
import {Component} from 'react';
import { withRouter } from "react-router-dom";
import ReactGA from 'react-ga';
import 'whatwg-fetch'
var HermodWebClient = require('./hermod_client.js')
export default withRouter(class HermodClient extends Component {
    constructor(props) {
        super(props);
        this.state={
            isListening: false,
            isSpeaking: false,
            isPlaying: false,
            microphoneState: 0,
            slots:[],
            transcript:'',
            nlu:'',
            nlu_json:{},
            say:'',
            isWaiting:false,
            question: '',
            frame: '',
            images: [],
            image: '',
            buttons: [],
            connected: false
        } 
        this.useAnalytics = false;
        this.toggleMicrophone = this.toggleMicrophone.bind(this)
        this.setQuestion = this.setQuestion.bind(this)
        this.initClient = this.initClient.bind(this)
        this.showFrame = this.showFrame.bind(this)  
        this.showWindow = this.showWindow.bind(this)  
        this.analyticsEvent = this.analyticsEvent.bind(this)
        this.startWaiting = this.startWaiting.bind(this)
        this.stopWaiting = this.stopWaiting.bind(this)
        this.sendMessage = this.sendMessage.bind(this)
        this.navigateTo = this.navigateTo.bind(this)
        this.setNluJson = this.setNluJson.bind(this)
    }
    
    navigateTo(target) {
        this.props.history.push(target)        
    }
    
    initClient() {
            let that = this;
           
            fetch('/config')
            .then(function(response) {
                return response.json()
            }).then(function(config) {
                var protocol = 'ws://'
                var port = 9001
                if (window.location.protocol === "https:") {
                    protocol = 'wss://'
                }
                if (!config.server) config.server = protocol + window.location.hostname + ':' + port; 
                
                that.setState({config:config})
                var clearSpeechTimeout = null
                if (config['analytics_code'] && config['analytics_code'].length > 0) {
                    that.useAnalytics = true
                    ReactGA.initialize(config['analytics_code']);
                    ReactGA.pageview(window.location.pathname + window.location.search);
                }
                
                config['javascript_environment'] = 'react'
                that.client = new HermodWebClient(config)
                that.setState({client:that.client})
                that.client.bind('hotwordDetected',function() {
                })
                that.client.bind('hotwordReady',function() {
                   that.setState({hotwordReady: true})
                })
                that.client.bind('microphoneStart',function() {
                   that.setState({microphoneState: 3})
                })
                that.client.bind('hotwordStart',function() {
                   that.setState({ microphoneState: 2})
                })
                that.client.bind('hotwordStop',function() {
                  that.setState({microphoneState: 1})
                })
                that.client.bind('microphoneStop',function() {
                   that.setState({microphoneState: 2})
                })
                that.client.bind('disconnect',function() {
                   that.setState({microphoneState: 0, connected: false})
                })
                that.client.bind('reconnect',function() {
                   that.setState({microphoneState: 0, connected: true})
                })
                that.client.bind('connect',function() {
                  that.setState({microphoneState: 1, connected: true})
                  that.client.sendMessage('hermod/'+config.site+'/rasa/get_domain',{})
    
                })
                that.client.bind('startSpeaking',function() {
                    that.setState({isSpeaking: true})
                })
                that.client.bind('stopSpeaking',function() {
                    that.setState({isSpeaking: false})
                })
                that.client.bind('startPlaying',function() {
                    that.setState({isPlaying: true})
                })
                that.client.bind('stopPlaying',function() {
                    that.setState({isPlaying: false})
                })
                
                that.client.bind('message',function(message,payloadIn) {
                    var parts = message.split("/")
                    
                    var payload = {}
                    var intentName = ''    
                    var cleanEntities = {}
                    
                    function jsonPayload(payloadIn) {
                        var pl = {}
                        try {
                            pl = JSON.parse(payloadIn.toString())
                        } catch (e) {
                        }
                        return pl;
                    }
                    payload = jsonPayload(payloadIn)
                    // bind topics to functions passed down from parent component
                    var altparts = message.split("/")
                    altparts[1] = '+';
                    var alttopic = altparts.join("/")
                    if (that.props.bindTopic && alttopic in that.props.bindTopic && that.props.bindTopic[alttopic] !== null) {
                        try {
                            that.props.bindTopic[alttopic](payload)
                        } catch (e) {
                            console.log(e)
                        }
                    }
                    
                    if (parts.length > 3 && parts[2] === "display" && parts[3] === "show" ) {
                        if (payload.url && payload.url.length > 0) {
                            that.client.showUrl(payload.url)
                        }
                        if (payload.frame && payload.frame.length > 0) {
                            that.showFrame(payload.frame)
                        }
                        if (payload.youtube && payload.youtube.length > 0) {
                            that.showYoutube(payload.youtube)
                        }
                        if (payload.image && payload.image.length > 0) {
                            that.showImages([payload.image])
                        }
                        if (payload.images && payload.images.length > 0) {
                            that.showImages(payload.images)
                        }
                        if (payload.buttons && payload.buttons.length > 0) {
                            that.setState({buttons: payload.buttons})
                        }
                        if (payload.navigate && payload.navigate.length > 0) {
                            that.navigateTo(payload.navigate)
                        }
                
                    } else if (parts.length > 3 && parts[2] === "dialog"  && parts[3] === "slots") {
                        that.setState({slots: payload})
                    } else if (parts.length > 3 && parts[2] === "rasa"  && parts[3] === "domain") {
                        that.setState({domain: payload})                        
                    } else if (parts.length > 3 && parts[2] === "asr"  && parts[3] === "text") {
                        that.setState({question:payload.text, transcript: payload.text, nlu:'', say:''})
                        if (clearSpeechTimeout) clearTimeout(clearSpeechTimeout) 
                        clearSpeechTimeout = setTimeout(function() {
                            that.setState({transcript: ''})
                        },3000)
                    } else if (parts.length > 3 && parts[2] === "dialog"  && parts[3] === "end") {
                        that.setState({transcript: ""})
                    } else if (parts.length > 3 && parts[2] === "nlu"  && parts[3] === "intent") {
                        intentName = payload.intent && payload.intent.name ? payload.intent.name : '' 
                        cleanEntities = {}
                        if (intentName.length > 0 && payload.entities) {
                            for (var i in payload.entities) {
                                var entity = payload.entities[i]
                                if (entity.entity && entity.entity.length > 0 && entity.value && entity.value.length > 0 ) {
                                    cleanEntities[entity.entity] = entity.value
                                }
                            }
                            that.setState({nlu_json: payload,nlu_json_original:JSON.stringify(payload), nlu: intentName + JSON.stringify(cleanEntities), buttons: []})
                            that.analyticsEvent(intentName + JSON.stringify(cleanEntities))
                        }
                    } else if (parts.length > 3 && parts[2] === "nlu"  && parts[3] === "externalintent") {
                        intentName = payload.intent && payload.intent.name ? payload.intent.name : '' 
                        cleanEntities = {}
                        if (intentName.length > 0 && payload.entities) {
                            for (var k in payload.entities) {
                                var entitya = payload.entities[k]
                                if (entitya.entity && entitya.entity.length > 0 && entitya.value && entitya.value.length > 0 ) {
                                    cleanEntities[entitya.entity] = entitya.value
                                }
                            }
                            that.setState({nlu_json: payload, nlu: intentName + JSON.stringify(cleanEntities)})
                        }
                    }  else if (parts.length > 2 && parts[2] === "tts"  && parts[3] === "say") {
                        that.setState({say: payload.text}) 
                    }  else if (parts.length > 3  && parts[2] === "display" && parts[3] === "startwaiting") {
                        that.setState({isWaiting: true}) 
                    }  else if (parts.length > 3  && parts[2] === "display" && parts[3] === "stopwaiting") {
                        that.setState({isWaiting: false}) 
                    }
                })
                that.client.connect()
            }).catch(function(ex) {
                console.log('parsing failed', ex)
            })
    }
 
        
    componentDidMount() {
        this.initClient()
    };
    
    
    toggleMicrophone() {
        let that = this;
        var state = this.state.microphoneState;
        if (that.state.isPlaying) {
            that.client.stopPlaying()
            that.client.sendMessage('hermod/'+that.state.config.site+'/tts/finished',{})
        } else {          
            if (state === 1) { // connected stopped
                that.client.stopMicrophone()
                that.client.stopHotword()
                // trigger dialog start through hermod
                that.client.sendMessage('hermod/'+that.state.config.site+'/dialog/end',{})
            } else if (state === 2) {  // hotword active
                that.client.stopHotword()
                that.client.startMicrophone()
                that.client.sendMessage('hermod/'+that.state.config.site+'/hotword/detected',{})
            } else if (state === 3) { // active
                that.client.stopMicrophone()
                that.client.stopHotword()
                that.client.sendMessage('hermod/'+that.state.config.site+'/dialog/end',{})
            } else {
                
            }
        }
    }
    
    setNluJson(json) {
        this.setState({nlu_json:json})
    }
    
    setQuestion(event) {
        this.setState({question:event.target.value})
    }
 
    analyticsEvent(page,category='Navigation') {
          if (this.useAnalytics) {
              ReactGA.event({
                  category: category,
                  action:  page
                });
          }
      }
      

      showFrame(url) {
          this.setState({"frame":url})
          this.props.history.push('/frame');
      }
      
       showYoutube(url) {
          this.setState({"youtube":url})
          this.props.history.push('/youtube');
      }
      
      showImages(images) {
          this.setState({"images":images})
          this.props.history.push('/images');
      }
      
      showWindow(url) {
        var displayWindow = null;
        if (displayWindow) {
            displayWindow.close()
        }
        displayWindow = window.open(url)
      }
      
      startWaiting() {
        this.setState({isWaiting: true})
      }
      
      stopWaiting() {
        this.setState({isWaiting: false})
      }
      
      sendMessage(text) {
          this.client.sendASRTextMessage(this.state.config.site,text)
       }

    
    render() {
        if (this.state.config) {
                var api = {
                toggleMicrophone:this.toggleMicrophone,
                setQuestion:this.setQuestion,
                client: this.state.client,
                showFrame: this.showFrame,
                showWindow: this.showWindow,
                startWaiting: this.startWaiting,
                stopWaiting: this.stopWaiting,
                sendMessage: this.sendMessage,
                setNluJson: this.setNluJson
            }

          return (
            <div className="HermodClient">
            {this.props.children(this.state,api)}
            </div>
          );
        } else return null
    }
})


