
This repository provides a framework for building voice based applications. 
It can be used to build standalone alexa like devices that do not need the Internet. 
It can also be used to build web services that use a suite of machine learning technologies to integrate speech recognition into web pages.


!! This repository has recently been ported from nodejs to python.
In particular on ARM, in my experience, stable packages for speech recognition were more difficult to achieve with nodejs than python.
Additionally [RASA](http://rasa.com) written in python is a core part of the suite so the portage unifies the development environment for the server side.

!! At this time i haven't been able to install RASA on ARM (although I have in the past) due to missing libraries.

Access the historic nodejs version remains available via the [nodejs branch](https://github.com/syntithenai/hermod/tree/nodejs)


The software is provided as a suite of microservices that collaborate using a shared MQTT server.
Services include
- audio capture and playback services for local hardware
- audio to text - automated speech recognition(ASR)
- hotword optimised audio to text 
- text to speech (TTS)
- RASA based Natural Language Understanding (NLU) to determine intents and slots from text
- RASA routing using machine learning of stories to translate a history of intents and slots into a choice about the next action.


A detailed description of the messaging protocol between the services is provided HERE

The software also provides a vanilla javascript library and example for integrating a hotword and visual microphone into a web page.

The server software is built to allow many concurrent users. Local deepspeech ASR and RASA are processor and memory intensive. 
A pi4 can transcribe with deepspeech streaming returning results within a couple of seconds for a single user. 
Google online ASR is close to instant.

Services can be distributed across hardware.

The hermod services run in a single threaded asyncio loop to allow for scalability however each active google ASR stream starts a new multiprocessing thread (because
the Google ASR python library doesn't play well with asyncio).


!!! Compatibility

The software has been developed on Linux Desktop and relies on pyaudio and (optionally) pulseaudio for local microphone capture and playback. 
Cross platform audio on python is challenging. In particular streaming with asyncio. 
Implementation on Windows or OSX would require the use of an alternate python sound library that works for those platforms.
I am unclear about OS portability of other key libraries including deepspeech, picovoice and rasa.

For strictly web based services, audio is handled by the browser so no problems with audio.

The TTS service uses a Linux binary pico2wav to generate audio from text. An alternative would need to be found on other platforms.



!!! Quickstart

The suite provides a Dockerfile to build an image with all os and python dependancies.
The resulting image is available on docker hub as syntithenai/hermod-python.

By default, the image runs all the software required for the suite in a single container.
The image also provides a default set of RASA model files defining configuration, domain, intents, stories and actions for an agent that searches wikipedia.

It also provides a docker-compose.yml file to start the suite with services split into many containers.


```
# install docker
curl -fsSL https://get.docker.com -o get-docker.sh | sh
# start services
docker-compose up
# open http://localhost
```

Say "Hey Edison" or click the microphone button to enable speech and then ask a question.


!!! Installation

The software package has python dependencies that can be installed with 
```pip install -r requirements.txt```

There are also operating system requirements including 
- installation of a recent version of mosquitto that supports authentication
- pico2wav binary install for the TTS service
- portaudio
- pulseaudio
- download and install deep speech model
- ...
See the Dockerfile for install instructions.

The folder hermod-python contains a number of shell scripts for various development tasks using hermod as a docker image.

- run.sh - start hermod with all the related services in a single docker container
- bash.sh - start duckling then run bash inside the hermod container to allow CLI access
- ....

The folder hermod-python/src contains all the source code.

The entrypoint for the source code is the file services.py which has a number of command line arguments to enable and disable various features of the software suite.
See the source code for details.

For example
```python services.py -wam```

starts the mosquitto, web and action servers as well as the main hermod services.


!!! Secrets

To enable google login (and allow many users to access the website concurrently), you need to create a credentials for a service account.



To enable google ASR







Mosquitto admin user 
mosquitto_passwd


kill -HUP mosquitto  * mosquitto container watches /etc/mosquitto/password







!!! Monitoring

All communication between services is via mqtt so you can monitor by listening for messages

```apt install mosquitto-clients```

To track the conversation progress, use the admin login details and subscribe to a bunch of topics.
```
mqtt_sub -h localhost -u hermod -P -hermod_server  -v -t 'hermod/+/asr/+' -t 'hermod/+/nlu/+' -t 'hermod/+/dialog/+' -t 'hermod/+/hotword/+' -t 'hermod/+/intent' -t 'hermod/+/action' -t 'hermod/+/action/#' -t 'hermod/+/core/#' -t 'hermod/+/tts/#' -t 'hermod/+/speaker/started' -t 'hermod/+/speaker/finished'
```





!!! Developing with Hermod

It should be straight forward to build a model into the folder hermod-python/rasa/models and use either the local or web versions to speak to the model.

Developing with hermod is mainly developing with RASA. Building/training a model and implementing actions.

By default, dynamic actions are implemented using a local RASA action server. An actions.py file in the rasa folder includes classes that satisfy the Action api.

Because hermod runs in the context of an mqtt server, actions can communicate with the client in real time by sending messages. For example, the action can send an mqtt message 
to the topic hermod/myhsite/tts/say to have speech generated and spoken immediately (eg looking now) while the action continues to collate and process data before giving a final response.

Any text messages returned by RASA are collated and spoken automatically.

In a speech dialog, a conversation can end and switch the microphone back to hotword mode OR it can continue and leave the microphone active for a response from a user.
By default, the microphone will remain active. 

Two possible approaches to ending a dialog immediately
- the action can send a hermod/myhsite/dialog/end message.
- use the ActionEnd.py class found in the example model. The action will need to be included in your domain and in your stories as the last item in the story that is to be forcibly ended.

After a period of silence or failed recognition attempts, the microphone will turn itself back to hotword mode.


!!! Web Service

Web service hosts sample page with oauth login via google. When a user logs in, a password is generated and the mosquitto server password file is updated and reloaded.

If environment variables are set for google oauth, users can login using google to identify themselves.
If not set, the user defaults to no_user_login and all browsers accessing the page will share messages.

The sample web application provides a microphone and UI elements including buttons an iframe and an image.
The sample actions send MQTT hermod/mysite/display messages with parameters for url, image and buttons.
The microphone shows a dialog when the user speaks and when hermod replies.


!!! Web Client

The web client in hermod-python/www/static/bundle.js provides a vanilla javascript library for starting and stopping hotword and speech recognition/audio streaming.
An example web page showing a microphone and supporting 

To make changes to the library you will need to run browserify to repack.

```browserify index.js > static/bundle.js```

The client exposes methods including
- setVolume
- muteVolume
- unmuteVolume
- playSound
- stopPlaying
- say
- stopAll
- bind
- unbind
- startMicrophone
- stopMicrophone
- sendAndWaitFor
- sendAudioAndWaitFor
- sendMessage
- sendNLUMessage
- sendASRTextMessage
- authenticate
- connect
- disconnect
- startHotword
- stopHotword

eg
```
client = new window.HermodWebClient(config)
client.connect().then(function() {
    client.startHotword()
})
```



## Dialog Manager Overview

The dialog manager is the glue between the services.

Service output messages are consumed by the dialog manager which then sends another message to the next service in the stack.

Because mediation by the dialog manager is required at each step in the dialog flow, it is able to track and control the state of each dialog to ensure valid dialog flow and manage asynchronous collation of dialog components before some stages in the dialog.

In general, a service should send message to let the dialog manager know when it starts and stops.


### Typical Dialog Flow



<img src='message-flow-hermod.svg.png' style="background-color:white" />




When the dialog manager starts, it sends

- `hermod/<siteId>/microphone/start`
- `hermod/<siteId>/hotword/start`

When a session is initiated by one of 

- `hermod/<siteId>/hotword/detected`
- `hermod/<siteId>/dialog/start`

The dialog manager creates a new dialogId, then sends a series of MQTT messages to further the dialog.

- `hermod/<siteId>/microphone/start`
- `hermod/<siteId>/dialog>/asr/start`
- `hermod/<siteId>/dialog/started`

The ASR sends `hermod/<siteId>/asr/started` and when the ASR finishes detecting text it sends `hermod/<siteId>/text` with a JSON payload. 

The dialog manager hears this message and sends 
 with a text message to speak in the JSON body (For example asking a question)
- `hermod/<siteId>/asr/stop`
- `hermod/<siteId>/nlu/parse`

The NLU service hears the parse request and sends 

- `hermod/<siteId>/nlu/started`
- `hermod/<siteId>/nlu/intent` or `hermod/<siteId>/nlu/fail`.

The dialog manager hears the nlu intent message and sends 

- `hermod/<siteId>/intent`

The core application router hears the intent message and starts an action processing loop by asking rasa core to determine the next action recursively until the next action is either `action_listen` or `action_end`. At each step the core routing service sends a `hermod/<siteId>/action` message with a JSON body including the action and currently tracked slots.

The application service hears each action message and runs. When finished it sends `hermod/<siteId>/action/finished`.

The core routing service processes each action sequentially (by waiting for action/finished Message) and when the loop finishes, it sends messages to hand the dialog back to the user. When the final action is action_listen, the service sends `hermod/<siteId>/dialog/continue`. If the last action is action_end, the service sends `hermod/<siteId>/dialog/end`

The dialog manager hears the continue message and sends

- `hermod/<siteId>/microphone/start`
- `hermod/<siteId>/asr/start`

to restart voice recognition

OR

The dialog manager hears the end message. (This can be issued at any time). It clears the audio buffer and sends

- `hermod/<siteId>/microphone/start`
- `hermod/<siteId>/dialog/ended`
- `hermod/<siteId>/hotword/start`

to finish the dialog and enable the hotword detector.


### Dialog Extensions (TODO)

The dialog manager tracks when multiple ASR or NLU services of the same type indicate that they have started. It waits for all final responses and selects the highest confidence before sending the next message.

For example, when two ASR services on the same bus share a model key and respond to `hermod/<siteId>/asr/start` sending two `hermod/<siteId>/asr/started` messages,  the dialog manager waits for both to respond with `hermod/<siteId>/asr/text` before sending `hermod/<siteId>/nlu/parse`.

When two NLU services indicate they have started , the dialog manager waits before sending `hermod/<siteId>/intent`.

When Voice ID is enabled, the dialog manager waits for `hermod/<siteId>/voiceid/detected/<userId>`  before sending  `hermod/<siteId>/intent`.

When multiple devices in a room hear an utterance, they all respond at the same time. This affects Google Home, Alexa, Snips and Mycroft. 
Google has elements of a solution because an Android phone will show a notification saying "Answering on another device". Two Google Home devices in a room will both answer.

The hermod protocol with many satellites sharing a dialog service allows the solution that the  hotword server could be debounced. 

When the dialog manager hears 'hermod/<siteId>/hotword/detected' or 'hermod/<siteId>/dialog/start', it waits for a fraction of a second to see if there are any more messages with the same topic, where there are multiple messages, the one with the highest confidence/volume  is selected and the others are ignored.

?? The debounce introduces a short delay between hearing a hotword and starting transcription. To avoid requiring the user pause after the hotword, the ASR needs audio from immediately after the hotword is detected and before transcription is started. To support this, the media server maintains a short ring buffer of audio that is sent before audio data from the hardware. The length of audio that is sent can be controlled by a parameter prependAudio in the JSON body of a message to hermod/<siteId>/microphone/start






## Security

Where a device offers services over a network to other devices, the MQTT server must be exposed to network requests so MQTT authentication is required.

The mosquitto MQTT server includes an authentication plugin that allows configuration of users and access controls in various backend systems including postgres, myql, files, redis and mongodb. The default authentication plugin allows configuration of read and/or write access to any topic or wildcard topic by updating the access control field in the user collection of a mongodb database.

When using the authentication plugin, the client must provide username and password as part of the initial CONNECT message. Subscription to a topic is only allowed if the siteId matches the username and password.

The MQTT server authentication plugin can be initialised with a list of allowed sites or sites can be added on the fly by authenticated users.

To secure messages in transit, it is possible to configure the MQTT server to encrypt messages or perhaps easier to only allow access via secure websockets.

For a standalone device, network access to the MQTT server is prevented by a firewall or virtual private network and authentication is not required.


## Hermod Protocol Reference


### Media Streaming

The media server can play and record audio on a device and send or receive it from the MQTT bus. 

The ASR and Hotword services listen for audio via the MQTT bus. The TTS service sends audio file of generated speech to the MQTT bus.

This means that the ASR and Hotword services do not work unless the microphone service is started with `hermod/<siteId>/microphone/start`

To minimise traffic on the network, the dialog manager enables and disables media streaming in response to lifecycle events in the protocol. In particular, the dialog manager ensures audio recording is enabled or disabled in sync with the ASR or Hotword services. However when the suite is configured to keep the hotword enabled at all times, the microphone is left enabled as well.

The microphone service also implements silence detection and pauses sending packets when there is no voice detected.


#### Message Reference

**Incoming**

- `hermod/<siteId>/speaker/play`
    - Play the wav file on the matching siteId.


- `hermod/<siteId>/speaker/stop`
    - Stop playing all current audio output.


- `hermod/<siteId>/speaker/volume`
    - Set the volume for current and future playback.


- `/hermod/<siteId>/microphone/start`
    - Start streaming audio packets


- `hermod/<siteId>/microphone/stop`
    - Stop streaming audio packets

**Outgoing**

- `hermod/<siteId>/speaker/finished`
    - Sent when the audio from a play request has finished playing on the hardware.


- `hermod/<siteId>/microphone/audio`
    - Sent continuously when microphone is started.
    - Message contains audio packet (Format 1 channel, 16 bit, 16000 rate)


### Hotword recognition

A hotword recogniser is a special case of automated speech recognition that is optimised to recognising just a few phrases. Optimising for a limited vocabulary means that the recognition engine can use minimum memory and resources.

The hotword recogniser is used in the protocol to initiate a conversation.

The hotword service listens for audio via the MQTT bus. When the hotword is detected a message is sent to the bus in reply. 

If the service is enabled for the site, hermod/<siteId>/hotword/detected is sent. 

On low power satellite devices, to save the overhead of a local MQTT server, the hotword service can be configured to listen for audio through local hardware. In this configuration, the dialog manager must be configured to only start the microphone for ASR requests.

The service may respond to multiple different utterances. The messages indicating that the hotword has been detected include a hotword identifier in the JSON body to indicate which hotword was heard.

Commercial systems like Google Home and Alexa discriminate between applications by asking for the application by name after the hotword. This can lead to some very long incantations.

For example "Hey Google Ask Meeka Music to play some blues by JL Hooker".

To minimise this problem, the hotword system can be configured to use different ASR and NLU models based on which hotword is detected. With this configuration, each hotword has a different personality and optimised suite of intents.

There are a number of semi open source implementations of hotword services including picovoice porcupine, snowboy and pocketSphinx. The Snips hotword detector is closed source but free to use.

[Mycroft Precise](https://github.com/MycroftAI/mycroft-precise/wiki/Software-Comparison) is the fully open source and accurate. 

It is also possible to use the ASR engine to do keyword spotting against a minimal word model.
https://discourse.mozilla.org/t/feature-request-spotting-keywords/36042

#### Configuration

- models - array of objects specifying audio models
- hotwords - array of objects mapping hotword ids to asr and nlu  models
- detector - shared configuration for detector

See example configuration file for details.

#### Message Reference

**Incoming**

- `hermod/<siteId>/hotword/start`
- `hermod/<siteId>/hotword/stop`

**Outgoing**

- `hermod/<siteId>/hotword/detected`
	- Sent when service is enabled and hotword is detected.
	- JSON message body
		- hotword - identifier for the hotword that was heard.
		- asrModel - (optional) key to identify which ASR model should be used for the rest of the dialog.
		- nluModel - (optional) key to identify which NLU model should be used for the rest of the dialog.






### Automated Speech Recognition (ASR)

The ASR service converts audio data into text strings. The service listens on the MQTT bus for audio packets. 

When the ASR detects a long silence (XX sec) in the audio stream, the final transcript is sent and the ASR service clears it's audio transcription buffer for the site.

(TODO) Optionally (depending on the service implementation),  when the ASR detects a short silence in the audio data (word gap xx ms ), a partial transcript is sent.

ASR is the most computationally expensive element of the protocol. Some of the implementations described below require more processing power and memory than is available on a Raspberry Pi. In particular running multiple offline models is likely to be unresponsive on low power machines.

Open source implementations of ASR include Kaldi, Mozilla DeepSpeech and PocketSphinx.

Closed source implementations include Snips, Google and Amazon Transcribe. 

Snips has the advantage being optimised minimum hardware and for of providing a downloadable model so transcription requests can be run on local devices (including Raspberry Pi). 

The ASR service allows the use of a suite of ASR processor implementations where each model is customised. The `asrModel` parameter of an ASR start message allows switching between models on the fly. 

-   Snips provides a reasonable quality general model but works best when the using the web UI to create a specific ASR model. 
-   Google or Amazon offer the best recognition accuracy because of access to large voice data sets and would be more appropriate for arbitrary transcription.
-   The open source solutions are not quite as accurate as the commercial offerings [citing WER under 10%](https://hacks.mozilla.org/2017/11/a-journey-to-10-word-error-rate/)  which approaches the human error rate of 5.83 and works very well when combined with NLU.

Some implementations perform recognition once off on an audio fragment. Other implementations allow for streaming audio and sending intermediate recognition results.

ASR implementations from Google and Amazon provide punctuation in results.

Google also implements automatic language(en/fr/jp) detection and provides a request parameter to select background noise environment.

As at 28/12/18, Amazon and Google charge $0.006 AUD / 15 second chunk of audio.

Depending on the implementation, the ASR model can be fine tuned to the set of words you want to recognise. 

-   Snips provides a web UI to build and download models
-   Google allows phraseHints to be sent with a recognition request.
-   Amazon offers an API or web UI to develop vocabularies in addition to the general vocabulary.
-   The open source implementations Deepspeech and Kaldi offer examples of training the ASR model.

For some implementations, a pool of ASR processors is managed by the service to support multiple concurrent requests. In particular, implementation using Kaldi provides this feature using [gstreamer](https://github.com/alumae/kaldi-gstreamer-server).

#### Message Reference

**Incoming**

- `hermod/<siteId>/asr/start`
    - Start listening for audio to convert to text.
    - JSON body with 
        - model - ASR service/model to use in capturing text (optional default value - _default_)
        - requestId - (optional) unique id sent forwarded with results to help client connect result with original request

- `hermod/<siteId>/asr/stop`
    - Stop listening for audio to convert to text.

**Outgoing**

- `hermod/<siteId>/asr/started`
- `hermod/<siteId>/asr/stopped`

- `hermod/<siteId>/asr/partial`
    - Send partial text results
    - JSON body with
        - requestId
        - text - transcribed text
        - confidence - ASR transcription confidence

- `hermod/<siteId>/asr/text`  
    - Send final text results
    - JSON body with 
        -  requestId 
        -  text - transcribed text
        -  confidence - ASR transcription confidence

    


### Natural Language Understanding (NLU)

The NLU service parses text to intents and variable slots.

Parsing can be configured by specifying a model, allowed intents, allowed slots and confidence.

Custom models can be developed and trained using a web user interface (based on [rasa-nlu-trainer](https://github.com/aasaHQ/rasa-nlu-trainer)) or text files.

The NLU model is configured with slots. When slots are extracted, the processing pipeline may be able to transform the values and extract additional metadata about the slot values. For example converting "next tuesday" into a Date or recognising a value in a predefined slot type.

Parsing results are sent to hermod/nlu/intent as a JSON message. For example


`
{
    "intent": {
    "name": "restaurant_search",
    "confidence": 0.8231117999072759
    },
    "entities": [
        {
            "value": "mexican",
            "raw": "mexican",
            "entity": "cuisine",
            "type": "text"
        }
    ],
    "intent_ranking": [
        {
            "name": "restaurant_search",
            "confidence": 0.8231117999072759
        },
        {
            "name": "affirm",
            "confidence": 0.07618757211779097
        },
        {
            "name": "goodbye",
            "confidence": 0.06298664363805719
        },
        {
            "name": "greet",
            "confidence": 0.03771398433687609
        }
    ],
    "text": "I am looking for Mexican food"
}
`


The NLU service is implemented using RASA. RASA configuration allows for a pipeline of processing steps that seek for patterns and extract metadata. Initial steps in the pipeline prepare data for later steps.


#### Message Reference

**Incoming**


- `hermod/<siteId>/nlu/parse`
    - Convert a  sentence into intents and slots
    - With JSON body
        - text - sentence to convert into intents and slots

**Outgoing**

- `hermod/<siteId>/nlu/intent`
    - Send parsed intent and slots

- `hermod/<siteId>/nlu/fail`
    - Send when entity recognition fails because there are no results of sufficient confidence value.




### Dialog Manager 

The dialog manager coordinates the services by listening for MQTT messages and responding with MQTT messages to further the dialog.

The dialog manager tracks the state of all active sessions so that it can

- Send fallback messages if services timeout.
- Garbage collect session and access data.
- Log analytics data.


#### Message Reference

Outgoing messages are shown with => under the related incoming message.

- `hermod/<siteId>/hotword/detected`
- `hermod/<siteId>/dialog/start`
    - Start a dialog 
    - => `hermod/<siteId>/hotword/stop`
    - => `hermod/<siteId>/microphone/start`
    - => `hermod/<siteId>/asr/start`
    - => `hermod/<siteId>/dialog/started/<dialogId>`

** Where a dialog/start message includes a non empty text parameter in the message body, the dialog manager skips ASR and jumps to NLU **


- `hermod/<siteId>/dialog/start`  {text:'text sent directly'}
    - => hermod/<siteId>/hotword/stop`
    - => hermod/<siteId>/microphone/stop`
    - => `hermod/<siteId>/nlu/parse` {text:'text sent directly'}
    - => `hermod/<siteId>/dialog/started/<dialogId>`

- `hermod/<siteId>/dialog/continue`
    - Sent by an action to continue a dialog and seek user input.
    - JSON body 
        -   text - text to speak before waiting for more user input
        - ASR Model - ASR model to request
        - NLU Model - NLU model to request
        - Intents - Allowed Intents
    - => hermod/<siteId>/microphone/stop
    - => hermod/<siteId>/tts/say
    -    After hermod/<siteId>/tts/finished
        - => hermod/<siteId></pre>/microphone/start
        - => hermod/<siteId>/asr/start

- `hermod/<siteId>/asr/text`
    - => hermod/<siteId>/nlu/parse

- `hermod/<siteId>/nlu/intent`
    - => hermod/<siteId>/intent
    - OR
    - => hermod/<siteId>/nlu/fail 
        - Sent when entity recognition fails because there are no results of sufficient confidence value.


- `hermod/<siteId>/dialog/end`
    - The application that is listening for the intent, should send `hermod/<siteId>/dialog/end` when it's action is complete so the dialog manager can garbage collect dialog resources.
    - Respond with 
        -   `hermod/<siteId>/dialog/ended`
        -   `hermod/<siteId>/microphone/start`
        -   `hermod/<siteId>/hotword/start`



### Text to speech Service (TTS)

The text to speech service generates audio data from text. Audio containing the spoken text is sent to the media service via the MQTT bus.

Offline TTS implementations include Mycroft Mimic, picovoice, MaryTTS, espeak, [merlin](https://github.com/CSTR-Edinburgh/merlin) or speak.js in a browser.

Online TTS implementation include Amazon Polly and Google. These services support SSML markup.

[SuperSnipsTTS](https://gist.github.com/Psychokiller1888/cf10af3220b5cd6d9c92c709c6af92c2) provides a service implementation that can be configured to use a variety of implementations and fall back to offline implementations where required.

#### Message Reference

**Incoming**

`hermod/<siteId>/tts/say`

*   Speak the requested text by generating audio and sending it to the media streaming service.
*   Parameters
*   text - text to generate as audio
*   lang - (optional default en_GB)  language to use in interpreting text to audio

`hermod/<siteId>/speaker/finished`

*   When audio has finished playing send a message to hermod/<siteId>/tts/finished  to notify that speech has finished playing.

**Outgoing**

`hermod/<siteId>/speaker/play/<speechRequestId>`

*   speechRequestId is generated
*   Body contains WAV data of generated audio.

`hermod/<siteId>/tts/finished`

*   Notify applications that TTS has finished speaking.




## Links




## TODO

- build all skills script
- generate domain from config and skills folders  	
	
- rasa 2 stage fallback
https://rasa.com/docs/core/master/policies/#two-stage-fallback-policy

- Sample music player web application
- music player model
	- play some {tag}
	- play something by {artist}
	- stop
	- volume
	- start

- deepspeech asr component frequency filtering (as per deepspeech nodejs example)

- tests
	- mqtt based check each layer of service
	- rasa segregated training data for testing 

- story and model builder UI 
	- define some actions
	- start an interactive learning session
	- also explicit add intent, slot, action, template

- ARM image for pi with lightweight services - snips hotword/ASR/NLU and kaldi asr

- Service Monitoring (TODO) ? partially present
The dialog manager tracks the time duration between some messages so it can determine if services are not meeting performance criteria and provide useful feedback.
Where a services is deemed unresponsive, an error message is sent and the session is ended by sending `hermod/<siteId>/dialog/end`.
Services are considered unresponsive in the following circumstances
*   For the ASR service, If the time between <span style="text-decoration:underline;">asr/start</span> until <span style="text-decoration:underline;">asr/text</span> exceeds the configured maximumDuration
*   For the ASR service, If the time from ASR starting and then silence being detected , to asr/text or asr/fail exceeds the configured asrTimeout.
*   For the NLU service, If the time between nlu/parse and nlu/intent exceeds the configured nluTimeout
*   For the core routing service, If the time between nlu/intent and hermod/intent exceeds the configured coreTimeout
*   For the TTS service, if the time between tts/say and tts/finished
*   For the media streaming service, if the time between speaker/play and speaker/finished

