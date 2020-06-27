import React from "react";
import {Component} from 'react';
import { Button } from "react-bootstrap";
//import {BrowserRouter as Link} from 'react-router-dom'
import { BrowserRouter as Router, Link } from "react-router-dom";
import FullPageScrollerComponent from './FullPageScrollerComponent'
import logo from './logo.svg';


const ContentLast = ({children}) => (
  <div className="component" >
  <header className="App-header">
    <img src={logo} className="App-logo" alt="logo" />
    
    <a
      className="App-link"
      href="https://reactjs.org"
      target="_blank"
      rel="noopener noreferrer"
    >
      Learn React
    </a>
  </header>
  </div>
);
 
//const askButtonClick = function(e) {
    //console.log(e)
    //console.log(e.target.innerText)
//}
class ContentOne extends Component {
//const ContentOne = ({children,props}) => (

    render() {
        let that = this;
        return (
          <div className="component" >
          <h2 style={{clear: "both"}} >Hi, I'm Edison</h2>
             
            <div>Say <b>"Hey Edison"</b> or click on the microphone to trigger me,  then ask a question. I turn <b>Green</b> when I'm listening. </div>
                
                <div>Ask me a question and I'll do my best to answer. Click or say the examples below.</div>
                
                 <div style={{marginTop: '0.5em' ,clear: "both"}} className="helpSampleButtons" >
                    <Button variant="primary" onClick={function(e) {that.props.sendMessage(e.target.innerText)}} >What's the date</Button>
                    <Button variant="primary"  onClick={function(e) {that.props.sendMessage(e.target.innerText)}} >Define the word "colloquial"</Button>
                    <Button variant="primary"  onClick={function(e) {that.props.sendMessage(e.target.innerText)}} >Tell me about celery</Button>
                </div>
                <div style={{marginTop: '0.5em' ,clear: "both"}} className="helpSampleButtons" >
                    <Button variant="primary"  onClick={function(e) {that.props.sendMessage(e.target.innerText)}} >What's the capital of Australia</Button>
                    <Button variant="primary"  onClick={function(e) {that.props.sendMessage(e.target.innerText)}} >Spell the word "fuzy"</Button>
                     <Button variant="primary"  onClick={function(e) {that.props.sendMessage(e.target.innerText)}} >Search youtube for funny cats</Button>
                      <Button variant="primary"  onClick={function(e) {that.props.sendMessage(e.target.innerText)}} >Show me a picture of a motorbike</Button>
                       <Button variant="primary"  onClick={function(e) {that.props.sendMessage(e.target.innerText)}} >What are some synonyms for weak</Button>
                </div>
                  <br/><br/>
                <div style={{marginTop: '0.5em' ,clear: "both"}} >With all that information at hand, lets see if you can solve a crossword</div>
                <div className="helpSampleButtons" >
                    <Link  to='/crossword' ><Button variant="success"   size="lg"  >Start a crossword</Button></Link>
                    
                 </div>
          </div>
        );
    }
}

class ContentTwo extends Component {
    render() {
        let that = this;
        return (
          <div className="component" >
          <h2 style={{clear: "both"}} >What can I say ?</h2>
               
           <div style={{marginTop: '4em' ,clear: "both"}} >As we chat I'll suggest some follow up questions in the top menu.</div>
                          <div className="helpSampleButtons" >
                    <Button variant="secondary"  >And what's the population</Button>
                    <Button variant="secondary"  >Tell me more</Button>
                </div>
                <br/><br/>
                
          </div>        
        )
    }
}
//const ContentTwo = ({props}) => (

//);
//<div style={{marginTop: '0.5em' ,clear: "both"}} >You can also ask me to remember facts. </div>
        //<div className="helpSampleButtons" >
            //<Button variant="primary" >Remember that the capital of Australia is Tamworth</Button>
         //</div>
export default class HomePageContent extends Component {
    
    render() {
        let that = this;
      return (
        <div className="component homePageComponent">
           
                    <ContentOne sendMessage={that.props.sendMessage} />
                     <ContentTwo sendMessage={that.props.sendMessage}  />
            
                    
              
        </div>
      );
    };
} 
//<FullPageScrollerComponent>
  //</FullPageScrollerComponent> 
// onClick="client.sendASRTextMessage(config.site,'Remember that the capital of Australia is Tamworth')"
//onClick="client.sendASRTextMessage(config.site,'What is the capital of Australia')
//onClick="client.sendASRTextMessage(config.site,'Spell the word fuzy')"
//onClick="client.sendASRTextMessage(config.site,'define the word colloquial')" 
//onClick="client.sendASRTextMessage(config.site,'what is the date')" 
//onClick="client.sendASRTextMessage(config.site,'tell me about celery')" 
