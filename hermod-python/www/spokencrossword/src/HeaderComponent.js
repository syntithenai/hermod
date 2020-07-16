import React from "react";
import {Component} from 'react';
import { Button } from "react-bootstrap";
import MicrophoneComponent from './MicrophoneComponent'
import SpeechBubbleComponent from './SpeechBubbleComponent'
import SuggestionButtonsComponent from './SuggestionButtonsComponent'
import NluFixerComponent from './NluFixerComponent'


import { Link } from "react-router-dom";

export default class HeaderComponent extends Component {
    
    render() {
        let that = this;
      return (
        <div className="hermodHeader" style={{backgroundColor: "#b5a5f3", minHeight: "9em", width: "100%", top: 0, left: 0, position: 'fixed'}}>
          <MicrophoneComponent hermodClient={that.props.hermodClient} toggleMicrophone={this.props.toggleMicrophone} api={this.props.api} />
          <SpeechBubbleComponent hermodClient={that.props.hermodClient} />
          <div id="buttons" style={{float: "left", marginRight: "0.5em", padding: "0.5em"}}>
            <span  className="fixedButtons" id="fixedButtons" style={{float: "left", marginRight: "0.5em"}} >
                 <Link  to='/' ><Button style={{float: 'left'}} variant="secondary"  size="lg" >Home</Button></Link>
                 {(this.props.hermodClient.slots && this.props.hermodClient.slots.crossword) && <Link  to={'/crossword/'+this.props.hermodClient.slots.crossword} ><Button style={{marginLeft:'0.3em',float: 'left'}} variant="secondary"   >Crossword</Button></Link>}
            {that.props.hermodClient.microphoneState !== 1 &&  <Link  to='/about_edison' ><Button style={{marginLeft:'0.3em',float: 'left'}} variant="secondary"   >Help</Button></Link>}
            
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
//     {!(this.props.hermodClient.slots && this.props.hermodClient.slots.crossword) && <Link  to='/crosswords' ><Button style={{marginLeft:'0.3em',float: 'left'}} variant="secondary"   >Crossword</Button></Link>}
            
