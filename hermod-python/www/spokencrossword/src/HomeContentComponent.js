import React from "react";
import {Component} from 'react';
import { Button } from "react-bootstrap";
import { Link } from "react-router-dom";

class ContentOne extends Component {

    render() {
        let that = this;
        return (
          <div className="component" style={{marginLeft:'0.3em'}} >
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
                 <div className="helpSampleButtons" >
                 
                  <div style={{clear: "both"}} >As we chat I'll suggest some follow up questions in the top menu.</div>
                          <div className="helpSampleButtons" >
                            <Button variant="secondary"  >And what's the population</Button>
                            <Button variant="secondary"  >Tell me more</Button>
                        </div>
            <br/> <br/>  <br/><hr/>
                    <div style={{clear: "both"}} >I can also help you fill in the answers of crosswords by speaking. (You need to be looking at the crossword for this to work.)</div>
                    <Button variant="secondary"  >One across is Canberra</Button>
                 <br/>     <div style={{clear: "both"}} >With all that information at hand, lets see if you can solve a crossword</div>
                 
                    <Link  to='/crossword' ><Button variant="success"   size="lg"  >Start a crossword</Button></Link>
                     
                 </div>
            <br/> <br/>  <br/>
            <hr/>
                    <div style={{clear: "both"}} >
                    I'm still learning to speak your language. If I make a mistake you can update your question with the tools at the top of the page.
                    <br/>
                    <b>Select some text from your question and then press one of the buttons to update the search values.</b>
                    <br/>
                    As well as getting to the information you want, your updates will be integrated to improve the language models so we get it right next time.
                 </div>
                 <br/>  <br/>  <br/>
                 <br/>  <br/>  <br/>
                 <br/>  <br/>  <br/>
          </div>
        );
    }
}




export default class HomePageContent extends Component {
    
    render() {
        let that = this;
      return (
        <div className="component homePageComponent">
            <ContentOne sendMessage={that.props.sendMessage} />
        </div>
      );
    };
} 

