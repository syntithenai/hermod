import React from "react";
import { BrowserRouter as Router, Link , Redirect} from "react-router-dom";

const divStyle = {
    left: 0,
    top: 0,
     overflowY: 'hidden', 
     width: '100%',
     height: '100%',
     overflow: 'hidden', 
     border: 'None'
}

export default (props) => {
    if (props.hermodClient.frame && props.hermodClient.frame.length > 0) {
      return (
        <div className="component iframeComponent" style={{height:'90em'}}>
          <iframe title="Wikipedia" style={divStyle}  src={props.hermodClient.frame}></iframe>
        </div>
      );
    } else {
        return <Redirect to="/" />
    }
};
