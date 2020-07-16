import React from 'react';
import './App.css';
import { Button } from "react-bootstrap";

function SlotListComponent(props) {
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

export default SlotListComponent;
