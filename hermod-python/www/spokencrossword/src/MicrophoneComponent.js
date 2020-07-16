import React from 'react';
import {Component} from 'react';
import waitingIcon from './images/waiting_small.gif'
import {Link} from 'react-router-dom'
export default class MicrophoneComponent extends Component {
     
    render() {
        var that = this
        var borderColor = ''
        var backgroundColor = ''
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
        <div>
            {that.props.hermodClient.microphoneState !==1 && <button  id='microphoneButton' onClick={that.props.toggleMicrophone}  style={buttonStyle} >
              <div>
                    {that.props.hermodClient.isWaiting && <img style={waitingOverlayStyle} alt="microphone" id="waitingOverlay" src={waitingIcon}  />}
                    {micImage}
                    
                </div>
            </button>}
            
            {that.props.hermodClient.microphoneState === 1 && <Link to='/about_edison' onClick={that.props.api.client.startHotword} ><button  id='microphoneButton'  style={buttonStyle} >
              <div>
                    {micImage}
                    
                </div>
            </button></Link>}
        </div>
        );
        }
}
