import React from 'react';
import './App.css';
import { Button } from "react-bootstrap";

function SuggestionButtonsComponent(props) {
    var renderedButtons = []
    var i = 0;
    const sendMessage = function(e) {
         props.sendMessage(e.target.getAttribute('data-message'))
    }
    const showFrame = function(e) {
        props.showFrame(e.target.getAttribute('data-frame'))
    }
    const showWindow = function(e) {
        props.showWindow(e.target.getAttribute('data-url'))
    }
    
    for (i in props.buttons) {
       if (props.buttons[i].text) {
           renderedButtons.push(<Button key={i} variant="primary" data-message={props.buttons[i].text} onClick={sendMessage} >{props.buttons[i].label ? props.buttons[i].label : props.buttons[i].text}</Button>)                    //button.onclick=function() {client.sendASRTextMessage(config.site,thebutton.text)}
       } else if (props.buttons[i].frame) {
           renderedButtons.push(<Button key={i} variant="primary" data-frame={props.buttons[i].frame} onClick={showFrame} >{props.buttons[i].label}</Button>)
       } else if (props.buttons[i].url) {
           renderedButtons.push(<Button key={i} variant="primary" data-url={props.buttons[i].url} onClick={showWindow} >{props.buttons[i].label}</Button>)
       } 
    }
    
  return (
     <span style={{float: "left", marginRight: "0.5em", padding: "0.5em"}} className="dynamicButtons" id="dynamicButtons" >
                {renderedButtons}
    </span>
    
  );
}

export default SuggestionButtonsComponent;
