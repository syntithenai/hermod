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
     
    }

 
    
    render() {
        let that = this;
      return (
        <div className="hermodHeader" style={{backgroundColor: "#b5a5f3", minHeight: "9em", width: "100%", top: 0, left: 0, position: 'fixed'}}>
          <MicrophoneComponent hermodClient={that.props.hermodClient} toggleMicrophone={this.props.toggleMicrophone}/>
          <SpeechBubbleComponent hermodClient={that.props.hermodClient} />
          <div id="buttons" style={{float: "left", marginRight: "0.5em", padding: "0.5em"}}>
            <span  className="fixedButtons" id="fixedButtons" style={{float: "left", marginRight: "0.5em"}} >
                 <Link  to='/' ><Button style={{float: 'left'}} variant="secondary"  size="lg" >Home</Button></Link>
                 {(this.props.hermodClient.slots && this.props.hermodClient.slots.crossword) && <Link  to={'/crossword/'+this.props.hermodClient.slots.crossword} ><Button style={{marginLeft:'0.3em',float: 'left'}} variant="secondary"   >Crossword</Button></Link>}
                 {!(this.props.hermodClient.slots && this.props.hermodClient.slots.crossword) && <Link  to='/crosswords' ><Button style={{marginLeft:'0.3em',float: 'left'}} variant="secondary"   >Crossword</Button></Link>}
            </span>
            <SuggestionButtonsComponent  buttons={that.props.hermodClient.buttons} sendMessage={that.props.sendMessage}  showFrame={that.props.showFrame}  showWindow={that.props.showWindow}/>
        </div>
        
      
        
        <div style={{float: "left",marginLeft: "0.5em", marginRight: "0.5em", clear: "both" , width: "90%"}}  >
             <NluFixerComponent  intents={[]}   entities={[]} hermodClient={this.props.hermodClient}  api={this.props.api} setQuestion={this.props.setQuestion} />  
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
