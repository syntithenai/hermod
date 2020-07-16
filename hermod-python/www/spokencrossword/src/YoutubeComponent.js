import React from "react";
import {  Redirect} from "react-router-dom";
import YouTube from 'react-youtube';

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
