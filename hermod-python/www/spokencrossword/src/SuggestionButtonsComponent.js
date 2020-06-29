import React from 'react';
import './App.css';
import { Button } from "react-bootstrap";

//document.getElementById('dynamicbuttons').style.display='block'
    //buttonsList = document.createElement('span')
    //buttonsList.id = 'dynamicbuttons'
    //for (var i = 0; i< buttons.length; i++) {
        //button = document.createElement('button')
        //button.innerText = buttons[i].label ? buttons[i].label : 'Missing Label'
        ////console.log('loop button')
        ////console.log(buttons[i])
        //function appendbutton(thebutton,buttonsList) {
            //if (thebutton.text) {
                //button.onclick=function() {client.sendASRTextMessage(config.site,thebutton.text)}
            //} else if (thebutton.nlu) {
                //button.onclick=function() {client.sendNLUMessage(config.site,thebutton.nlu)}
            //} else if (thebutton.url) {
                //button.onclick=function() {showUrl(thebutton.url)}
            //} else if (thebutton.frame) {
                //button.onclick=function() {showFrame(thebutton.frame)}
            //}
            //button.className='btn'
            //buttonsList.append(button)
        //}
        //appendbutton(buttons[i],buttonsList)
    //}

function SuggestionButtonsComponent(props) {
    //console.log(props)
    var renderedButtons = []
    var i = 0;
    const sendMessage = function(e) {
         props.sendMessage(e.target.getAttribute('data-frame'))
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
