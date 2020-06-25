import React from "react";

export default () => {
  return (
    <div className="component first-component" style={{textAlign:'left', marginLeft:'1em'}}>
        <h2>About This Software</h2>
        <div>This software is a demonstration for Hermod, a suite of tools for building applications with voice.</div>
        <br/>
        
        <div>The software is freely available under a FreeBSD Open Source License.<br/></div>

        <a href='https://github.com/syntithenai/hermod' >Github</a>
        <br/>
        <div>
            Built using 
            <ul> 
                <li><a href="https://github.com/mozilla/DeepSpeech" >Deepspeech Voice Recognition</a></li>
                <li><a href="https://picovoice.ai/" >Picovoice Hotword Recognition</a></li>
                <li><a href="https://rasa.com/docs/rasa/nlu/about/" >RASA</a></li>
                <li>and many other open source projects</li>
            </ul>
            </div>
            <div>
            Help improve Deepspeech
            <br/>
            <a  href="https://voice.mozilla.org/en/speak" >Contribute your voice to the Mozilla Open Source Voice Dataset</a>
        </div>
    </div>
  );
};
