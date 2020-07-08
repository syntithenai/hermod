import React from "react";
import { Button } from "react-bootstrap";
export default () => {
  return (
    <div className="component first-component" style={{textAlign:'left', marginLeft:'1em'}}>
        <h2>About This Software</h2>
        <div>This software is a demonstration for Hermod, a suite of tools for building applications with voice.</div>
        <br/>
        
        <div>The software is freely available under a FreeBSD Open Source License.<br/></div>

        <a  target="_new" href='https://github.com/syntithenai/hermod' ><Button style={{marginLeft:'1em'}}  >Developer Documentation</Button></a>
        <a href="https://github.com/syntithenai/hermod/issues" target="_new"  ><Button style={{marginLeft:'1em'}}  >Report a problem</Button></a>
        <br/>
        <div>
            Built using 
            <ul> 
                <li><a target="_new" href="https://rasa.com/docs/rasa/nlu/about/" >RASA</a></li>
                <li><a target="_new"  href="https://github.com/mozilla/DeepSpeech" >Deepspeech Voice Recognition</a></li>
                <li><a target="_new"  href="https://picovoice.ai/" >Picovoice Hotword Recognition</a></li>
                <li>and many other open source projects</li>
            </ul>
            </div>
            <div>
            Help improve Deepspeech
            <br/>
            <a  target="_new"  href="https://voice.mozilla.org/en/speak" ><Button  variant="success"  >Contribute your voice to the Mozilla Open Source Voice Dataset</Button></a>
        </div>
         <br/>
         <div>
         This software brings together information from 
            <ul> 
                <li>Wikipedia, Wiktionary and Wikidata to answer questions <a target="_new" href="https://donate.wikimedia.org/w/index.php?title=Special:LandingPage&country=AU&uselang=en&utm_medium=donatewiki_page&utm_source=Ways_to_Give&utm_campaign=donate_now_btn" >Support the Wikimedia Foundation</a></li>
                <li>Images from <a  target="_new" href ="https://unsplash.com/" >Unsplash</a></li>
                <li>and Videos from <a  target="_new" href ="https://youtube.com/" >Youtube</a></li>
            </ul>
          </div>
        
    </div>
  );
};
