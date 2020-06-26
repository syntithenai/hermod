import React from "react";
import {Component} from 'react';
import { Button } from "react-bootstrap";
import MicrophoneComponent from './MicrophoneComponent'
import SpeechBubbleComponent from './SpeechBubbleComponent'
import SuggestionButtonsComponent from './SuggestionButtonsComponent'
import NluFixerComponent from './NluFixerComponent'


import { BrowserRouter as Router, Link } from "react-router-dom";
//style={{float: "left", marginRight: "0.5em"}}
//style={{float: "left", marginRight: 0.5 +"em"}}
// style={{float: 'left'}}


export default class HeaderComponent extends Component {
    
    
  constructor(props) {
      super(props);
      //let that = this;
      this.sendForm = this.sendForm.bind(this)
    }

    sendForm(e) {
        console.log('SEMD FORM')
        let that = this;
        e.preventDefault()
        that.props.sendMessage(that.props.hermodClient.question)
        return false;
    }

    render() {
        let that = this;
      return (
        <div className="hermodHeader" style={{backgroundColor: "#2b30d23b", minHeight: "9em", width: "100%", top: 0, left: 0, position: 'fixed'}}>
          <MicrophoneComponent hermodClient={that.props.hermodClient} toggleMicrophone={this.props.toggleMicrophone}/>
          <SpeechBubbleComponent hermodClient={that.props.hermodClient} />
          <div id="buttons" style={{float: "left", marginRight: "0.5em", padding: "0.5em"}}>
            <span  className="fixedButtons" id="fixedButtons" style={{float: "left", marginRight: "0.5em"}} >
                 <Link  to='/' ><Button style={{float: 'left'}} variant="primary"  size="lg" >Home</Button></Link>
            </span>
            <SuggestionButtonsComponent  buttons={that.props.hermodClient.buttons} sendMessage={that.props.sendMessage}  showFrame={that.props.showFrame}  showWindow={that.props.showWindow}/>
        </div>
        
        <div style={{float: "left",marginLeft: "0.5em", marginRight: "0.5em", clear: "both" , width: "90%"}}  >
              <form onSubmit={that.sendForm} ><input style={{fontSize: "1.8em" , width: "100%"}} id="text_input" type='text' value={that.props.hermodClient.question} onChange={that.props.setQuestion} placeholder='Type your question here' /></form>
        </div> 
        
        <div style={{float: "left",marginLeft: "0.5em", marginRight: "0.5em", clear: "both" , width: "90%"}}  >
             <NluFixerComponent intents={[]}   entities={[]}  />  
        </div>
        </div>
      );
    }
};
//<!--img style="height: 2em; width: 2em; padding: 0.4em" src='microphone-slash-solid.svg' /-->
   
    
    //<div class="speech-bubble-wrap">
        //<div id="speechbubble" class="speech-bubble">this is a bubble </div>
    //</div>

    //const divStyle = {
        ////position: 'fixed',
        ////top:0,
        ////left:0,
        //width: '98%',
        ////height: '10em',
        //border: '3px solid black',
        //backgroundColor:'red',
        ////padding:''
    //}
    //onClick="showHome()"
