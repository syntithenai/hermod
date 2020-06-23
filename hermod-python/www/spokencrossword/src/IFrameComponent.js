import React from "react";


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
  return (
    <div className="component iframeComponent" style={{height:'90em'}}>
      <iframe title="Wikipedia" style={divStyle}  src={props.hermodClient.frame}></iframe>
    </div>
  );
};
