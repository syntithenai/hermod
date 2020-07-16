import React from 'react';
import {Component} from 'react';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css'
import {BrowserRouter as Router} from 'react-router-dom'
import PropsRoute from './PropsRoute';

import HomeContentComponent from "./HomeContentComponent";
import CrosswordComponent from "./CrosswordComponent";
import HeaderComponent from "./HeaderComponent";
import FooterComponent from "./FooterComponent";
import IFrameComponent from "./IFrameComponent";
import YoutubeComponent from "./YoutubeComponent";
import AboutComponent from './AboutComponent';
import ImageListComponent from './ImageListComponent';
import LoginComponent from './LoginComponent';
//import AboutEdisonComponent from './AboutEdisonComponent';

import HermodClient from './HermodClient';
import CrosswordListComponent from './CrosswordListComponent';

export default class App extends Component {

  constructor(props) {
      super(props);
      this.fillCrossword=this.fillCrossword.bind(this)
    }

    
      componentDidMount() {
        this.crossword =  React.createRef();
      };
      
   
   fillCrossword(payload) {
       if (this.crossword) {
           this.crossword.current.fillAnswer(payload.direction,payload.number,payload.word);
        }
   }
   
    render() {
      let that = this;
      return (
        <div className="App">
            <Router>
                <HermodClient bindTopic={{"hermod/+/crossword/fill": that.fillCrossword}} >
                {(hermodClient, api) => (
                    <div>
                        <PropsRoute  path="/" hermodClient={hermodClient} component={HeaderComponent} api={api} showFrame={api.showFrame} showWindow={api.showWindow} sendMessage={api.sendMessage} toggleMicrophone={api.toggleMicrophone} setQuestion={api.setQuestion} />
                        <div style={{marginTop:"9em"}}>
                        <div>{JSON.stringify(this.props.hermodClient)}</div>
                            <PropsRoute  exact={true} path="/" hermodClient={hermodClient} component={CrosswordListComponent} sendMessage={api.sendMessage}  />
                            <PropsRoute  exact={true} path="/home"  hermodClient={hermodClient}  component={HomeContentComponent} sendMessage={api.sendMessage}   />
                            <PropsRoute  exact={true} path="/crossword" connected={hermodClient.connected} site={hermodClient.config.site} api={api} hermodClient={hermodClient}  component={CrosswordComponent} crosswordRef={this.crossword}  startWaiting={api.startWaiting} stopWaiting={api.stopWaiting}  />
                            <PropsRoute  exact={true} path="/crossword/:id" connected={hermodClient.connected} site={hermodClient.config.site} api={api}  hermodClient={hermodClient}  component={CrosswordComponent} crosswordRef={this.crossword}  startWaiting={api.startWaiting} stopWaiting={api.stopWaiting}  />
                            <PropsRoute  exact={true} path="/crosswords"  hermodClient={hermodClient}  component={CrosswordListComponent} startWaiting={api.startWaiting} stopWaiting={api.stopWaiting}  />
                            <PropsRoute  exact={true} path="/frame"  hermodClient={hermodClient}  component={IFrameComponent}   />
                            <PropsRoute  exact={true} path="/youtube"  hermodClient={hermodClient}  component={YoutubeComponent}   />
                            <PropsRoute  exact={true} path="/about"  hermodClient={hermodClient} component={AboutComponent}  />
                            <PropsRoute  exact={true} path="/login"  hermodClient={hermodClient} component={LoginComponent}   />
                            <PropsRoute  exact={true} path="/images"  images={hermodClient.images} component={ImageListComponent}   />
                            <PropsRoute  exact={true} path="/about_edison"  hermodClient={hermodClient}  component={HomeContentComponent} sendMessage={api.sendMessage}   />
                        </div>
                        
                        <FooterComponent slots={hermodClient.slots} adsenseClient={hermodClient.adsenseClient} adsenseSlot={hermodClient.adsenseSlot} />
                    </div>
                  )}
                </HermodClient>
            </Router>
            
        </div>
      );
    }
}
