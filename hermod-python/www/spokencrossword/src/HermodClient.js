/* global window */


import React from 'react';
import {Component} from 'react';
//import logo from './logo.svg';
//import './App.css';
//import 'bootstrap/dist/css/bootstrap.min.css'
import { withRouter } from "react-router-dom";
//import {BrowserRouter as Router,Route,Link,Switch,Redirect} from 'react-router-dom'
//import PropsRoute from './PropsRoute';
import ReactGA from 'react-ga';
import 'whatwg-fetch'
//console.log('aaa')
var HermodWebClient = require('./hermod_client.js')

//<script data-ad-client="ca-pub-8152690534650306" async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"></script>

//<script data-ad-client="ca-pub-8152690534650306" async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"></script>
export default withRouter(class HermodClient extends Component {

    constructor(props) {
        super(props);
        //let that = this; 
        this.state={
            isListening: false,
            isSpeaking: false,
            isPlaying: false,
            microphoneState: 0,
            slots:[],
            transcript:'',
            nlu:'',
            say:'',
            isWaiting:false,
            question: '',
            frame: '',
            images: [],
            image: '',
            buttons: []
        } 
        this.useAnalytics = false;
        this.toggleMicrophone = this.toggleMicrophone.bind(this)
        this.setQuestion = this.setQuestion.bind(this)
        this.initClient = this.initClient.bind(this)
        this.sendMessage = this.sendMessage.bind(this)  
        this.showFrame = this.showFrame.bind(this)  
        this.showWindow = this.showWindow.bind(this)  
        this.analyticsEvent = this.analyticsEvent.bind(this)
        console.log('hc constr')
        console.log(this.props.history)
    }
    
    initClient() {
            let that = this;
           
            fetch('/config')
            .then(function(response) {
                return response.json()
            }).then(function(config) {
                //{
                    //"server": "https://localhost:3000", 
                    //"mqttServer": "wss://peppertrees.asuscomm.com:9001", 
                    //"username": "hermod_admin",
                    //"password": "talk2mebaby",
                    //"subscribe": "hermod/hermod_admin_web/#",
                    //"hotwordsensitivity" : 0.5    ,
                    //"site" :"hermod_admin_web",
                    //"analytics_code": "UA-3712973-3"
                //}

                //config = {
                    //server: protocol + window.location.hostname + ':' + port, 
                    //username: data.email_clean,
                    //password: data.password,
                    //subscribe: "hermod/"+data.email_clean+"/#",
                    //hotwordsensitivity : 0.5    ,
                    //site:data.email_clean,
                //}
                //config.site = config.email_clean
                
                                
                var protocol = 'ws://'
                var port = 9001
                if (window.location.protocol === "https:") {
                    protocol = 'wss://'
                }
                if (!config.server) config.server = protocol + window.location.hostname + ':' + port; 
                    
                
                that.setState({config:config})
                var clearSpeechTimeout = null
                console.log(['GOT CONFIG',config])
                if (config['analytics_code'] && config['analytics_code'].length > 0) {
                    console.log('INIT ANALYTICS '+config['analytics_code'])
                    that.useAnalytics = true
                    ReactGA.initialize(config['analytics_code']);
                    //,{debug: true}
                    ReactGA.pageview(window.location.pathname + window.location.search);
                }
                
                config['javascript_environment'] = 'react'
                that.client = new HermodWebClient(config)
                that.client.bind('hotwordDetected',function() {
                   //that.setState({isListening: true})
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
                   that.setState({microphoneState: 0})
                })
                that.client.bind('reconnect',function() {
                   that.setState({microphoneState: 0})
                })
                that.client.bind('connect',function() {
                  that.setState({microphoneState: 1})
                })
                that.client.bind('startSpeaking',function() {
                    console.log('START SPEAKING')
                    that.setState({isSpeaking: true})
                })
                that.client.bind('stopSpeaking',function() {
                    console.log('STOP SPEAKING')
                    that.setState({isSpeaking: false})
                })
                that.client.bind('startPlaying',function() {
                    console.log('START PLAYING')
                    that.setState({isPlaying: true})
                })
                that.client.bind('stopPlaying',function() {
                    console.log('STOP PLAYING')
                    that.setState({isPlaying: false})
                })
                
                that.client.bind('message',function(message,payloadIn) {
                    var parts = message.split("/")
                    
                    var payload = {}
                        
                    function jsonPayload(payloadIn) {
                        var pl = {}
                        try {
                            pl = JSON.parse(payloadIn.toString())
                        } catch (e) {
                        }
                        return pl;
                    }
                    
                    
                    if (parts.length > 3 && parts[2] === "display" && parts[3] === "show" ) {
                        //console.log('DISPLAYMESSAGE')
                        payload = jsonPayload(payloadIn)
                        if (payload.url && payload.url.length > 0) {
                            that.client.showUrl(payload.url)
                        }
                        if (payload.frame && payload.frame.length > 0) {
                            //that.setState({frame: payload.frame})
                            that.showFrame(payload.frame)
                        }
                        if (payload.youtube && payload.youtube.length > 0) {
                            //that.setState({image: payload.image})
                            that.showYoutube(payload.youtube)
                        }
                        if (payload.image && payload.image.length > 0) {
                            //that.setState({image: payload.image})
                            that.showImages([payload.image])
                        }
                        if (payload.images && payload.images.length > 0) {
                            //that.setState({images: payload.images})
                            that.showImages(payload.images)
                        }
                        if (payload.buttons && payload.buttons.length > 0) {
                            that.setState({buttons: payload.buttons})
                        }
                        if (payload.question && payload.question.length > 0) {
                            that.setState({question: payload.question})
                        }
                        
                
                    } else if (parts.length > 3 && parts[2] === "dialog"  && parts[3] === "slots") {
                        //console.log('slots')
                        payload = jsonPayload(payloadIn)
                        that.setState({slots: payload.slots})
                        //showSlots(payload)
                    } else if (parts.length > 3 && parts[2] === "asr"  && parts[3] === "text") {
                        //console.log('asr text')
                        payload = jsonPayload(payloadIn)
                        that.setState({transcript: payload.text, nlu:'', say:''})
                        if (clearSpeechTimeout) clearTimeout(clearSpeechTimeout) 
                        clearSpeechTimeout = setTimeout(function() {
                            that.setState({transcript: ''})
                        },3000)
                    } else if (parts.length > 3 && parts[2] === "nlu"  && parts[3] === "intent") {
                        //console.log('nlu intent')
                        payload = jsonPayload(payloadIn)
                        var intentName = payload.intent && payload.intent.name ? payload.intent.name : '' 
                        var cleanEntities = {}
                        if (intentName.length > 0 && payload.entities) {
                            for (var i in payload.entities) {
                                var entity = payload.entities[i]
                                console.log(entity)
                                if (entity.entity && entity.entity.length > 0 && entity.value && entity.value.length > 0 ) {
                                    cleanEntities[entity.entity] = entity.value
                                }
                            }
                            that.setState({nlu: intentName + JSON.stringify(cleanEntities), buttons: []})
                            that.analyticsEvent(intentName + JSON.stringify(cleanEntities))
                        }
                    }  else if (parts.length > 2 && parts[2] === "tts"  && parts[3] === "say") {
                        payload = jsonPayload(payloadIn)
                        console.log('say text '+payload.text)
                        that.setState({say: payload.text}) 
                    }  else if (parts.length > 3  && parts[2] === "display" && parts[3] === "startwaiting") {
                        //console.log('start wait')
                        that.setState({isWaiting: true}) 
                    }  else if (parts.length > 3  && parts[2] === "display" && parts[3] === "stopwaiting") {
                        //console.log('stop wait')
                        that.setState({isWaiting: false}) 
                    }
                   //console.log([message,payload]) 
                })
                that.client.connect()
                //.then(that.client.startHotword)
                
            //}).then(function(json) {
                //console.log('parsed json', json)
            }).catch(function(ex) {
                console.log('parsing failed', ex)
            })
            //var config = 
            //{
                //server: 'https://localhost:9001', 
                //username: "hermod_admin",
                //password: "talk2mebaby",
                //subscribe: "hermod/hermod_admin_web/#",
                //hotwordsensitivity : 0.5    ,
                //site:"hermod_admin_web"
            //}
    }
 
        
    componentDidMount() {
        console.log('APP MOUNT')
        this.initClient()
          //ReactGA.initialize(process.env.REACT_APP_ANALYTICS_KEY);
        ////  console.log('mount layout GA key '+process.env.REACT_APP_ANALYTICS_KEY)
          //this.handleLogin()
          //this.fetchTopicCollections(); 
          
      };
        //function onClick() {
            //console.log('onclick '+state)
            //// state 0 - disconnected no click
            //if (state == 0) { // not connected
                ////client.connect().then(function() {
                    //////state = 1
                    ////client.startHotword()
                    //////.then(function() { 
                    ////state = 2
                    //////})
                ////})
            //} else if (state == 1) { // connected stopped
                //client.stopMicrophone()
                //client.stopHotword()
                //// trigger dialog start through hermod
                //client.sendMessage('hermod/'+config.site+'/dialog/end',{})
            //} else if (state == 2) {  // hotword active
                //client.stopHotword()
                //client.startMicrophone()
                //client.sendMessage('hermod/'+config.site+'/hotword/detected',{})
            //} else if (state == 3) { // active
                //client.stopMicrophone()
                //client.stopHotword()
                //client.sendMessage('hermod/'+config.site+'/dialog/end',{})
            //}
        //}
    
    toggleMicrophone() {
        let that = this;
        var state = this.state.microphoneState;
        if (that.state.isPlaying) {
            that.client.stopPlaying()
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
            } 
            //else if (state === 4) {
                //that.client.stopPlaying()
                //that.client.stopMicrophone()
                //that.client.stopHotword()
                //that.client.sendMessage('hermod/'+that.state.config.site+'/dialog/end',{})
            //}
        }
        
        //status = (status + 1) % 4;
        //this.setState({microphoneState: status, isWaiting: true ,buttons:[{label:'Frame', frame:'https://wikipedia.org'},{label:'Window', url:'https://wikipedia.org'},{label:'Click me', text:'search for boats'}]})
        
        //setTimeout(function() {that.setState({isWaiting: false})},1000)
        
    }
    
    setQuestion(event) {
        this.setState({question:event.target.value})
    }
 
    analyticsEvent(page,category='Navigation') {
          if (this.useAnalytics) {
              console.log(['ANALYTICS CURRENTPAGE',page]);
              
              //ReactGA.pageview(window.location.pathname + window.location.search);
              ReactGA.event({
                  category: category,
                  action:  page
                });
          }
      }; 
      
      sendMessage(text) {
          console.log('SNED MESSAGE '+text)
          this.client.sendASRTextMessage(this.state.config.site,text)
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
        console.log('show window '+url)
        var displayWindow = null;
        if (displayWindow) {
            displayWindow.close()
        }
        displayWindow = window.open(url)
      }
      

    
    render() {
        var api = {
            toggleMicrophone:this.toggleMicrophone,
            setQuestion:this.setQuestion,
            client: this.client,
            sendMessage: this.sendMessage,
            showFrame: this.showFrame,
            showWindow: this.showWindow
        }

      return (
        <div className="HermodClient">
        {this.props.children(this.state,api)}
        </div>
      );
    }
})


