

## TODO

### Microphone
- recording duration timeout + other timeout

### AppServer
- say method (and other helpers -> end, continue) export available in app server intent functions
- debounce

apt-get install speech-dispatcher espeak




# WEBSOCKET ERRORS
* WebSocket connection to 'ws://localhost:9001/mqtt' failed: A server must not mask any frames that it sends to the client.

* mqttws31.min.js:36 WebSocket connection to 'ws://localhost:9001/mqtt' failed: Invalid frame header

* index.es.js:149 ["  SERVER onConnectionLost:AMQJS0008I Socket closed."]

# OTHER
* index.es.js:467 The Web Audio autoplay policy will be re-enabled in Chrome 71 (December 2018). Please check that your website is compatible with it. https://goo.gl/7K7WLu



### Opensnips
- extend logger to replace opensnips with nodejs replacements for snips-scripts (plus gstreamer-kaldi and rasa server)
* props.disableDefaultListeners 
* kaldi retraining based on user recordings

* methods suitable for nodejs and browser 
  - SnipsAudioServer
  - SnipsTtsServer
  - SnipsHotwordServer
  - SnipsDialogueServer
  - SnipsAsrServer (with kaldi)
  - SnipsNluServer (with rasa)
  - SnipsAppServer
  - SnipsRasaCoreAppServer
  - SnipsTrainingServer (with kaldi/rasa)
        - start with slot values
        - rasa intents
        - rasa core
  - ?? SnipsAirTokensWorker - arbitrary work (training) distributed to clients ??
  - SnipsVoiceIdServer
        - piwho mqtt listener -> userId events
        - ??? pi voiceId/login hooks
  - SnipsDiscoveryServer - mqtt based site discovery


### Snips Image
- sam
- sam login entrypoint in docker image + update docs
- skills server
- toggle services


## OpenSnips aims to be an implementation of the Snips Hermes MQTT protocol in javascript
- run Snips Services in a web browser or in nodejs on a server and orchestrate a mixture of them.
- using PocketSphinx.js for ASR and a custom NLU module, with a local only MQTT proxy, the whole stack can be run in a Web Browser.
- switch between a number of providers of ASR (Snips/Kaldi/Google/Amazon Polly/OpenSphinx/DeepSpeech/???) and NLU (Snips/RASA/Custom/DialogFlow/??) services 

- implement audio on the server using mpg123 and sox as base layers for cross platform support to Windows as well as Linux/Mac/Android.
- support simultaneous input from multiple sources (audioserver -> intent) debounced to trigger a single intent.

- support distributed training via the mqtt protocol.

Because OpenSnips relies on a number of services, we suggest using Docker to orchestrate the suite of microservices as per the included example.




### Config

- inputvolume
- outputvolume
- voicevolume
- ttsvoice
- voicerate
- voicepitch
- remotecontrol
- hotword
- hotwordsensitivity
- silencedetection
- silencesensitivity
- enabletts
- enableaudio
- enablenotifications

