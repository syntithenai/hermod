/* global navigator */
import React, { Component } from 'react'
// Polyfill: mediaDevices.
// Not work on Desktop Safari, IE.
// Not work on Mobile browsers.

let nav = {};
nav.mediaDevices = function() {
    if (navigator.mediaDevices) {
        return navigator.mediaDevices;
    }

    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
    if (navigator.getUserMedia) {
        return {
            getUserMedia: function (c) {
                return new Promise(function(y, n) {
                        navigator.getUserMedia.call(navigator, c, y, n);
                    }
                );
            }
        }
    }
}();
if (!nav.mediaDevices) {
    alert("mediaDevices() not supported.");
    throw new Error("mediaDevices() not supported.")
}

// Polyfill: AudioContext.
window.AudioContext = window.AudioContext || window.webkitAudioContext || window.mozAudioContext || window.msAudioContext;

export default class AudioMeter extends Component {

    constructor (props) {
        super(props);
        this.state = {
            volume: 0,
            debug: false
        };
    }

    componentDidMount () {

        // Processing.
        var process = function (event) {
            var buf = event.inputBuffer.getChannelData(0);
            var sum = 0;
            var x;

            for (var i = 0; i < buf.length; i++) {
                x = buf[i];
                sum += x * x;
            }

            var rms = Math.sqrt(sum / buf.length);
            this.setState({
                volume: (Math.max(rms, this.state.volume * this.averaging) )
            });
            //console.log('Volume: ' + this.state.volume);
            if (this.state.volume > (this.props.volumeWarning > 0 ? this.props.volumeWarning : 0.25)) this.canvasCtx.fillStyle =  this.props.style.tooLoudColor ? this.props.style.tooLoudColor  : '#FF0000';
            else this.canvasCtx.fillStyle =  this.props.style.color ? this.props.style.color  : '#00FF48';
            this.canvasCtx.clearRect(0, 0, this.canvasCtx.canvas.width, this.canvasCtx.canvas.height);
            this.canvasCtx.fillRect(0, this.canvasCtx.canvas.height * (1 - (this.state.volume * 4)), this.canvasCtx.canvas.width, this.canvasCtx.canvas.height);

        }.bind(this);

        // Init processing.
        nav.mediaDevices.getUserMedia(
            {
                audio: true
            }
        ).then(function(stream) {
                var audioCtx = new AudioContext();
                var source = audioCtx.createMediaStreamSource(stream);
                var processor = audioCtx.createScriptProcessor(256);
                let gainNode = audioCtx.createGain();
                gainNode.gain.value = this.props.inputvolume > 0 ? this.props.inputvolume/100 : 0.5;
                //console.log(['IV',this.props.inputvolume]);
                this.averaging = 0.95;
                this.canvasCtx = this.refs.canvas.getContext('2d');
                this.canvasCtx.fillStyle = this.props.style.color ? this.props.style.color  : '#00FF48';

                processor.onaudioprocess = process;
                processor.connect(audioCtx.destination);
                gainNode.connect(processor);
                source.connect(gainNode);
                if (this.props.addInputGainNode) this.props.addInputGainNode(gainNode);
            }.bind(this)
        ).catch(function(err){
                console.log('Error occurred while initalizing audio input: ' +  err.toString());
            });
    }


    render () {
        
        let canvasStyle = this.props.style ? Object.assign({},this.props.style) : {};
        canvasStyle.height = this.props.style.height > 0 ? this.props.style.height : 78;
        canvasStyle.width = this.props.style.width > 0 ? this.props.style.width : 30;
        return (
                <canvas style={canvasStyle} ref="canvas" width={canvasStyle.width} height={canvasStyle.height}></canvas>
            
        );
    }
};
