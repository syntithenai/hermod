navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

var PicovoiceAudioManager = (function(addInputGainNode,inputvolume) {
    const inputBufferLength = 2048;

    let inputSampleRate;
    let engine;
    let processCallback;
    let isProcessing = false;

    let inputAudioBuffer = [];

    let process = function(inputAudioFrame) {
       // console.log('PVM  process audio frmae');
        if (!isProcessing) {
            return;
        }

        for (let i = 0 ; i < inputAudioFrame.length ; i++) {
            inputAudioBuffer.push((inputAudioFrame[i]) * 32767);
        }

        while(inputAudioBuffer.length * engine.sampleRate / inputSampleRate > engine.frameLength) {
            let result = new Int16Array(engine.frameLength);
            let bin = 0;
            let num = 0;
            let indexIn = 0;
            let indexOut = 0;

            while(indexIn < engine.frameLength) {
                bin = 0;
                num = 0;
                while(indexOut < Math.min(inputAudioBuffer.length, (indexIn + 1) * inputSampleRate / engine.sampleRate)) {
                    bin += inputAudioBuffer[indexOut];
                    num += 1;
                    indexOut++;
                }
                result[indexIn] = bin / num;
                indexIn++;
            }

            processCallback(engine.process(result));

            inputAudioBuffer = inputAudioBuffer.slice(indexOut);
        }
       // console.log('PVM  process audio frmae');
    };

    let getUserMediaSuccessCallback = function(stream) {
        let audioContext = new (window.AudioContext || window.webkitAudioContext)();
        let gainNode = audioContext.createGain();
        gainNode.gain.value = inputvolume > 0 ? inputvolume/100 : 0.5;
        let audioSource = audioContext.createMediaStreamSource(stream);

        inputSampleRate = audioSource.context.sampleRate;

        let engineNode = audioSource.context.createScriptProcessor(inputBufferLength, 1, 1);
        
        //addInputGainNode
        
        
        engineNode.onaudioprocess = function(ev) { process(ev.inputBuffer.getChannelData(0)); };
        // global volume
        if (addInputGainNode) addInputGainNode(gainNode);
        
        audioSource.connect(gainNode);
        gainNode.connect(engineNode);
        engineNode.connect(audioSource.context.destination);
    };

    this.start = function(picovoiceEngine, picovoiceProcessCallback, errorCallback) {
       // console.log('PVM START');
       // console.log('pvam start');
        if (!navigator.getUserMedia) {
            errorCallback("this browser does not support audio capture");
        }

        navigator.getUserMedia({audio: true}, getUserMediaSuccessCallback, errorCallback);

        engine = picovoiceEngine;
        processCallback = picovoiceProcessCallback;
        isProcessing = true;
    };

    this.stop = function() {
        //console.log('PVM START');
      //  console.log('pvam stop');
        isProcessing = false;
        inputAudioBuffer = [];
    };
    this.continueProcessing = function() {
        //console.log('PVM CONTINUE');
      //  console.log('pvam continue');
        isProcessing = true;
     };
    this.pauseProcessing = function() {
       // console.log('PVM PAUSE');
    //    console.log('pvam pause');
        isProcessing = false;
    };
});
