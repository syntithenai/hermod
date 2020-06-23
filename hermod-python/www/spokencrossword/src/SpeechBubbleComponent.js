import React from 'react';
import {Component} from 'react';
//import { BrowserRouter as Router, Link } from "react-router-dom";

export default class SpeechBubbleComponent extends Component {
    
    render() {
      let that = this;

     const wrapStyle = {
            position: "fixed",
            top: "4em",
            right: "8em",
            minWidth: "15em"
      }
      
      const bubbleStyle = {
        position: "relative",
        background: "#38cedc",
        borderRadius: ".4em",
        minHeight: "3em",
        width: "100%",
        padding: "0.5em",
        textDecoration: "none",
        textAlign:"left"
      }
      
      var visible = false
      if (that.props.hermodClient.transcript  && that.props.hermodClient.transcript.length > 0) {
          visible = true;
      }
         
      return (
        <div style={wrapStyle} className="speechBubbleComponent">
         {visible &&   <div  style={bubbleStyle} id="speechbubble" className="speech-bubble">
             <div style={{fontWeight: 'bold'}} >{that.props.hermodClient.transcript}</div>
             {that.props.hermodClient.nlu && <div><i>{that.props.hermodClient.nlu}</i></div>}
             {that.props.hermodClient.say && <div>{that.props.hermodClient.say}</div>}
             </div>}
        </div>
      );
    }
}

