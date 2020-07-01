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

function SlotListComponent(props) {
    //console.log(props)
    var renderedButtons = []
    var i = 0;

    for (i in props.slots) {
       if (props.slots[i] && props.slots[i].length > 0) {
           renderedButtons.push(<Button key={i} variant="light"  >{i} {props.slots[i]}</Button>)     
       } 
    }
    
  return (
     <div style={{float: "left", marginRight: "0.5em", padding: "0.5em", clear:'both'}} className="slotList" id="slotList" >
                {renderedButtons}
    </div>
    
  );
}
// 
export default SlotListComponent;
