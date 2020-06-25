import React from "react";
import { BrowserRouter as Router, Link , Redirect} from "react-router-dom";
import YouTube from 'react-youtube';

const divStyle = {
    left: 0,
    top: 0,
     overflowY: 'hidden', 
     width: '100%',
     height: '100%',
     minHeight: '400px',
     minWidth: '400px',
     overflow: 'hidden', 
     border: 'None'
}

const opts = {
      height: '600',
      //width: '90%',
      playerVars: {
        // https://developers.google.com/youtube/player_parameters
        autoplay: 1,
      },
    };

function _onReady(event) {
    // access to player in all event handlers via event.target
   // event.target.pauseVideo();
  }
  
export default (props) => {
    if (props.hermodClient.youtube && props.hermodClient.youtube.length > 0) {
      return (
        <div className="component youtubeComponent" >
          <YouTube videoId={props.hermodClient.youtube} opts={opts} onReady={_onReady} />
        </div>
      );
    } else {
        return <Redirect to="/" />
    }
};
