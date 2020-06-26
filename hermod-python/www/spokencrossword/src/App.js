import React from 'react';
import {Component} from 'react';
//import logo from './logo.svg';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css'
//r,Route,Link,Switch,Redirect
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
import HermodClient from './HermodClient';

export default class App extends Component {

  //constructor(props) {
      //super(props);
      ////let that = this;
    //}

    
      componentDidMount() {
        console.log('APP dMOUNT')
      };
      
   
    render() {
      return (
        <div className="App">
            <Router>
                <HermodClient>
                {(hermodClient, api) => (
                    <div>
                        <PropsRoute  path="/" hermodClient={hermodClient} component={HeaderComponent}  showFrame={api.showFrame} showWindow={api.showWindow} sendMessage={api.sendMessage} toggleMicrophone={api.toggleMicrophone} setQuestion={api.setQuestion} />
                        <div style={{marginTop:"9em"}}>
                            <PropsRoute  exact={true} path="/" hermodClient={hermodClient} component={HomeContentComponent} sendMessage={api.sendMessage}  />
                            <PropsRoute  exact={true} path="/home"  hermodClient={hermodClient}  component={HomeContentComponent} sendMessage={api.sendMessage}   />
                            <PropsRoute  exact={true} path="/crossword"  hermodClient={hermodClient}  component={CrosswordComponent}   />
                            <PropsRoute  exact={true} path="/frame"  hermodClient={hermodClient}  component={IFrameComponent}   />
                            <PropsRoute  exact={true} path="/youtube"  hermodClient={hermodClient}  component={YoutubeComponent}   />
                            <PropsRoute  exact={true} path="/about"  hermodClient={hermodClient} component={AboutComponent}  />
                            <PropsRoute  exact={true} path="/login"  hermodClient={hermodClient} component={LoginComponent}   />
                            <PropsRoute  exact={true} path="/images"  images={hermodClient.images} component={ImageListComponent}   />
                        </div>
                        <FooterComponent adsenseClient={hermodClient.adsenseClient} adsenseSlot={hermodClient.adsenseSlot} />
                    </div>
                  )}
                </HermodClient>
            </Router>
            
        </div>
      );
    }
}
