import React from 'react';
import {Component} from 'react';
import waitingIcon from './images/waiting_small.gif'

export default class MicrophoneComponent extends Component {
     //constructor(props) {
      //super(props);
      ////let that = this;
    //}
    //const buttonStyle={}
    //const micOffIcon =  <svg style={buttonStyle}  aria-hidden="true" data-prefix="fas" data-icon="microphone" className="svg-inline--fa fa-microphone fa-w-11" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 352 512"><path fill="currentColor" d="M176 352c53.02 0 96-42.98 96-96V96c0-53.02-42.98-96-96-96S80 42.98 80 96v160c0 53.02 42.98 96 96 96zm160-160h-16c-8.84 0-16 7.16-16 16v48c0 74.8-64.49 134.82-140.79 127.38C96.71 376.89 48 317.11 48 250.3V208c0-8.84-7.16-16-16-16H16c-8.84 0-16 7.16-16 16v40.16c0 89.64 63.97 169.55 152 181.69V464H96c-8.84 0-16 7.16-16 16v16c0 8.84 7.16 16 16 16h160c8.84 0 16-7.16 16-16v-16c0-8.84-7.16-16-16-16h-56v-33.77C285.71 418.47 352 344.9 352 256v-48c0-8.84-7.16-16-16-16z"></path></svg>

    //const micOnIcon = <svg style={buttonStyle}  aria-hidden="true" data-prefix="fas" data-icon="microphone-slash" className="svg-inline--fa fa-microphone-slash fa-w-20" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512"><path fill="currentColor" d="M633.82 458.1l-157.8-121.96C488.61 312.13 496 285.01 496 256v-48c0-8.84-7.16-16-16-16h-16c-8.84 0-16 7.16-16 16v48c0 17.92-3.96 34.8-10.72 50.2l-26.55-20.52c3.1-9.4 5.28-19.22 5.28-29.67V96c0-53.02-42.98-96-96-96s-96 42.98-96 96v45.36L45.47 3.37C38.49-2.05 28.43-.8 23.01 6.18L3.37 31.45C-2.05 38.42-.8 48.47 6.18 53.9l588.36 454.73c6.98 5.43 17.03 4.17 22.46-2.81l19.64-25.27c5.41-6.97 4.16-17.02-2.82-22.45zM400 464h-56v-33.77c11.66-1.6 22.85-4.54 33.67-8.31l-50.11-38.73c-6.71.4-13.41.87-20.35.2-55.85-5.45-98.74-48.63-111.18-101.85L144 241.31v6.85c0 89.64 63.97 169.55 152 181.69V464h-56c-8.84 0-16 7.16-16 16v16c0 8.84 7.16 16 16 16h160c8.84 0 16-7.16 16-16v-16c0-8.84-7.16-16-16-16z"></path></svg>
    
    //le
    //<button  id='microphone_button'   onClick=onClick() style="position: fixed; top: 0.5em; right: 0.5em; font-size: 1.2em; background-color:grey; border: 2px solid black; border-radius: 2em; height: 4em; width: 4em; text-decoration: none; outline: none">
        //<div style="position: relative">
        //<img id="waiting-overlay" src="/waiting_small.gif" style="display: none; position: fixed;  top: 0.8em; right: 0.8em; height: 3.2em; opacity: 0.2; z-index: 50" />
            //<svg aria-hidden="true" style="position: fixed; top: 14px; right: 14px; height: 2.7em; width: 2.7em; padding: 0.3em; z-index: 60"  focusable="false" data-prefix="fas" data-icon="microphone" class="svg-inline--fa fa-microphone fa-w-11" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 352 512"><path fill="currentColor" d="M176 352c53.02 0 96-42.98 96-96V96c0-53.02-42.98-96-96-96S80 42.98 80 96v160c0 53.02 42.98 96 96 96zm160-160h-16c-8.84 0-16 7.16-16 16v48c0 74.8-64.49 134.82-140.79 127.38C96.71 376.89 48 317.11 48 250.3V208c0-8.84-7.16-16-16-16H16c-8.84 0-16 7.16-16 16v40.16c0 89.64 63.97 169.55 152 181.69V464H96c-8.84 0-16 7.16-16 16v16c0 8.84 7.16 16 16 16h160c8.84 0 16-7.16 16-16v-16c0-8.84-7.16-16-16-16h-56v-33.77C285.71 418.47 352 344.9 352 256v-48c0-8.84-7.16-16-16-16z"></path></svg>
            //<!--img style="height: 2em; width: 2em; padding: 0.4em" src='microphone-slash-solid.svg' /-->
        //<div>
    //</button>
    
    //&& this.props.hermodClient.hotwordReady
    render() {
        var borderColor = ''
        var backgroundColor = ''
        console.log(['MIC',this.props.hermodClient.isPlaying,this.props.hermodClient.microphoneState])
        if (this.props.hermodClient.isPlaying) { 
            borderColor = 'green'
            backgroundColor = 'lightblue'
        } else {
            borderColor = 'black'
            backgroundColor = 'grey'
            if (parseInt(this.props.hermodClient.microphoneState) === 1) {
                borderColor = 'green'
                backgroundColor = 'grey'
            } else if (parseInt(this.props.hermodClient.microphoneState) === 2 ) {
                borderColor = 'red'
                backgroundColor = 'pink'
            } else if (parseInt(this.props.hermodClient.microphoneState) === 3) {
                borderColor = 'green'
                backgroundColor = 'green'
            }
        }

        const micStyle = {position: "fixed", top:'0.9em', right:'0.9em', height:"3.1em", width:"3.1em", padding:"0.3em", zIndex: 60}
        const buttonStyle = {
            position: "fixed",
            top: "0.5em",
            right: "0.5em",
            fontSize: "1.2em",
            backgroundColor:backgroundColor,
            border: "2px solid "+borderColor,
            borderRadius: "2em",
            height: "4em",
            width: "4em",
            textDecoration: "none",
            outline: "none"
        }
        const waitingOverlayStyle = {
            position: "fixed",
            top: "0.8em", 
            right: "0.8em", 
            height: "3.2em", 
            opacity: 0.2, 
            zIndex: 50
        }

        const micImage = <svg   style={micStyle}  aria-hidden="true" id="micImage"  focusable="false" data-prefix="fas" data-icon="microphone" className="microphoneImage" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 352 512"><path fill="currentColor" d="M176 352c53.02 0 96-42.98 96-96V96c0-53.02-42.98-96-96-96S80 42.98 80 96v160c0 53.02 42.98 96 96 96zm160-160h-16c-8.84 0-16 7.16-16 16v48c0 74.8-64.49 134.82-140.79 127.38C96.71 376.89 48 317.11 48 250.3V208c0-8.84-7.16-16-16-16H16c-8.84 0-16 7.16-16 16v40.16c0 89.64 63.97 169.55 152 181.69V464H96c-8.84 0-16 7.16-16 16v16c0 8.84 7.16 16 16 16h160c8.84 0 16-7.16 16-16v-16c0-8.84-7.16-16-16-16h-56v-33.77C285.71 418.47 352 344.9 352 256v-48c0-8.84-7.16-16-16-16z"></path></svg>   
        return (
            <button  id='microphoneButton' onClick={this.props.toggleMicrophone}  style={buttonStyle} >
              <div>
                    {this.props.hermodClient.isWaiting && <img style={waitingOverlayStyle} alt="microphone" id="waitingOverlay" src={waitingIcon}  />}
                    {micImage}
                    
                </div>
            </button>
        );
        }
}
//<svg aria-hidden="true" style="position: fixed; top: 14px; right: 14px; height: 2.7em; width: 2.7em; padding: 0.3em; z-index: 60"  focusable="false" data-prefix="fas" data-icon="microphone" class="svg-inline--fa fa-microphone fa-w-11" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 352 512"><path fill="currentColor" d="M176 352c53.02 0 96-42.98 96-96V96c0-53.02-42.98-96-96-96S80 42.98 80 96v160c0 53.02 42.98 96 96 96zm160-160h-16c-8.84 0-16 7.16-16 16v48c0 74.8-64.49 134.82-140.79 127.38C96.71 376.89 48 317.11 48 250.3V208c0-8.84-7.16-16-16-16H16c-8.84 0-16 7.16-16 16v40.16c0 89.64 63.97 169.55 152 181.69V464H96c-8.84 0-16 7.16-16 16v16c0 8.84 7.16 16 16 16h160c8.84 0 16-7.16 16-16v-16c0-8.84-7.16-16-16-16h-56v-33.77C285.71 418.47 352 344.9 352 256v-48c0-8.84-7.16-16-16-16z"></path></svg>
            

//{JSON.stringify(this.props.hermodClient)}       
            
