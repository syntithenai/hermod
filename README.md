This repository provides a framework for building voice based applications. 

It was created to simplify integrating custom speech services into a website.

It can also be used to build standalone alexa like devices that do not need the Internet. 


Demo [https://edison.syntithenai.com](https://edison.syntithenai.com)

> **This project has recently been ported from nodejs to python.**
> In particular on ARM, in my experience, stable packages for speech recognition were more difficult to achieve with nodejs than python.
> Additionally [RASA](http://rasa.com) written in python is a core part of the suite so the portage unifies the development environment for the server side.
> Access the historic nodejs version remains available via the [nodejs branch](https://github.com/syntithenai/hermod/tree/nodejs)


The software is provided as a suite of microservices that collaborate using a shared MQTT server.
Services include
- audio capture and playback services for local hardware
- audio to text - automated speech recognition(ASR)  using streaming for fastest transcriptions. Includes implementations for Deepspeech, IBM Watson and Google
- hotword optimised audio to text using picovoice.
- text to speech (TTS)
- RASA based Natural Language Understanding (NLU) to determine intents and slots from text
- RASA routing using machine learning of stories to translate a history of intents and slots into a choice about the next action.


The software also provides a vanilla javascript library and example for integrating a hotword and visual microphone into a web page as a client of the suite.
The client uses mqtt over websockets for live communication and streaming audio back to the hermod server.

The hermod services run in a single threaded asyncio loop to allow for scalability.

Services can be distributed across hardware connected by a shared MQTT server.


## Quickstart

The suite provides a Dockerfile to build an image with all os and python dependancies.

The resulting image is available on docker hub as syntithenai/hermod-python.

By default, the image runs all the software required for the suite in a single container.

This repository also provides a docker-compose.yml file to start the suite with services split into many containers.

The image also provides a default set of RASA model files defining configuration, domain, intents, stories and actions for an agent that searches wikipedia.


```
# install docker
sudo curl -fsSL https://get.docker.com -o get-docker.sh | sh

# install docker-compose
sudo curl -L https://github.com/docker/compose/releases/download/1.22.0/docker-compose-$(uname -s)-$(uname -m) -o /usr/local/bin/docker-compose

# clone this repository
git clone https://github.com/syntithenai/hermod.git

# change directory into it so relative paths in docker-compose.yml to host mounts work correctly
cd hermod

# copy environment from sample (edit as required)
cp .env-sample .env

# start services
sudo docker-compose up
# OR (with pulseaudio on host)  to enable local audio
# PULSE_HOST=`ip -4 route get 8.8.8.8 | awk {'print $7'} | tr -d '\n'` ; docker-compose up


```
Open  (http://localhost)[http://localhost] in a web browser.

Say "Hey Edison" or click the microphone button to enable speech and then ask a question.

If local audio is enabled, you can use the hotword "Picovoice" to activate a local dialog session.

**This will only work if you are running the server software on localhost. To serve hermod over a network, SSL must be enabled.**



## Compatibility

The suite was developed on using Ubuntu Desktop. It should work on most Linux systems.
It is largely written in python and requires at least python 3.7

As per the notes below, cross platform shouldn't be too much of a stretch.

- The TTS service uses a Linux binary pico2wav to generate audio from text. The Google TTS service is cross platform but requires the Internet.

- For strictly web based services, audio is handled by the client browser so no problems with audio devices.
The local Audio Service relies on pyaudio and (optionally) pulseaudio for local microphone capture and playback. 
Cross platform audio on python is challenging. In particular streaming with asyncio. 
Implementation on Windows or OSX would require the use of an alternate python sound library that works for those platforms.

- Raspberry pi4  with ARM runs deepspeech, picovoice and the rest of the hermod suite.
However, at this time i haven't been able to install RASA on ARM (although I have in the past) due to missing libraries. 



## Installation

The software package has python dependencies that can be installed with 
```pip install -r requirements.txt```

There are also operating system requirements including 
- python 3.7+
- nodejs
- installation of a recent version of mosquitto
- pico2wav binary install for the TTS service
- portaudio
- pulseaudio
- download and install deep speech model
- pip install -r requirements.txt in hermod-python/src
- npm install (in hermod-python/tests and hermod-python/rasa/chatito)

*See the hermod-python/Dockerfile for install instructions.**


The folder hermod-python contains a number of shell scripts for various development tasks using hermod as a docker image.

- run.sh - start hermod with all the related services in a single docker container
- bash.sh - start duckling then run bash inside the hermod container to allow CLI access
- ....


*See the source code for details.*


### Installation on AWS

Demo [https://edison.syntithenai.com](https://edison.syntithenai.com) runs on 

t3a.small instance (2 cores, 2G memory)
with a 16G root file system




### Mosquitto

Newer versions (1.6+) of mosquitto include an option to restrict the header size
```` websockets_headers_size 4096```

When websockets is sharing a domain with a Flask served web application, large cookies cause mosquitto to crash disconnect.

The docker image includes a build of mosquitto 1.6.7



## Configuration

The entrypoint for the source code is the file services.py which has a number of command line arguments to enable and disable various features of the software suite.

Environment variables are also used to configure the hermod services.

The file hermod-python/src/config-all.yml provides base configuration which is modified by the services file to account for arguments and environment variables and passed on to the hermod services.


### Arguments

Arguments to services.py are mainly used to specify which services should be activated.

Arguments include

- **m (--mqttserver)**   run local mqtt server
-  **r (--rasaserver)**    run local rasa server
- **w (--webserver)** run local web server
- **a (--actionserver)** run local rasa action server
- **d (--hermod)** run the hermod services
- **sm (--satellite)**  only run audio and hotword hermod services (for low power devices eg pi0 acting as a satellite that rely on central hermod server)
- **nl (--nolocalaudio)**   skip local audio and hotword services (instead use browser client)
-  **t (train)**  train RASA model when starting local server

For example to start the mosquitto, web and action servers as well as the main hermod services.
```python services.py -dwarm```


To start just the RASA server
```python services.py -r```

### Environment

When using docker-compose, add environment variables to each services by editing the docker-compose.yml file OR using a .env file in the same folder. 

The .env file is excluded from git and is a good place to store secrets.  To enable the sample file

```cp .env-sample  .env```

Without docker compose, environment variables should be present in the shell that runs ```python services.py```



### Deepspeech Model

The deepspeech model files required for speech recognition are not part of this repository.

**They are included in the docker image syntithenai/hermod-python available on docker hub.**

If you need to download them, 
```wget  -qO- -c https://github.com/mozilla/DeepSpeech/releases/download/v0.7.0/deepspeech-0.7.0-models.tar.gz ```

By default, the model files are expected to be found in in ../deepspeech-models  relative to the source directory.

The environment variable DEEPSPEECH_MODELS can be used to set an alternate path.




### Google  ASR

To enable high quality google speech recognition use console.developers.google.com to create and download credentials for a service account
with google speech recognition API enabled. This will require that you enable billing in your google project.

https://console.developers.google.com/

Set environment variables to enable
```
GOOGLE_APPLICATION_CREDENTIALS=path to downloaded creds file
GOOGLE_APPLICATION_LANGUAGE=optimise recognition for specified language. default en-AU
GOOGLE_ENABLE_ASR=true
```


If google credentials are provided, the DeepSpeechASR and IBMASR services will be automatically disabled.



Because the microphone is often restarted after executing an action, some requests to the service are very short bursts of silence which still incur the 15s minimum cost.

**22/05/2020**
The first 240 (< 15s) requests are free.
After than $0.024 USD/minute.
Pricing is calculated in 15s increments rounded up. 100 requests costs a minimum of $0.60 USD.

Because most utterances are only a fraction of 15s, the rounding up approach means Google is likely to be more expensive than IBM Watson speech recognition.

Google is noticably more able to accurately capture uncommon words and names than the IBM service ( or deepspeech )


### Google TTS

To offload the processing of text to speech generation and for high quality voices, an alternate TTS service implementation using google is provided.


Similarly to google ASR, enable the text to speech API in the google console, download credentials (can be the same file as ASR) and then set environment variables to enable
```
GOOGLE_APPLICATION_CREDENTIALS=path to downloaded creds file
GOOGLE_APPLICATION_LANGUAGE=optimise recognition for specified language. default en-AU
GOOGLE_ENABLE_TTS=true
```

**22/05/2020**
Google charge $4.00 USD per million characters.
IBM charge $20/million characters. They also offer a free tier of 10,000 characters per month.




### IBM HD ASR

Create resource for speech recognition and download credentials.
https://cloud.ibm.com/resources

Set environment variables to enable
```
IBM_SPEECH_TO_TEXT_APIKEY=your-key-here
IBM_SPEECH_TO_TEXT_REGION=us-east    
```
If ibm credentials are provided, the DeepSpeechASR service will be automatically disabled.

IBM speech to text pricing is calculated as the sum of all audio sent to the service over one month without rounding.

**22/05/2020**
The free plan provides 500 minutes each month.
The standard plan costs $0.0412 USD / minute.


    

### Authentication

A standalone server with local audio does not require authentication and uses the admin password preconfigured in the sample mosquitto file.


When using the web server, a user must uniquely identify themselves. When a user logs in, the authentication details for the mosquitto server are provided to the web client.

It is possible to run without authentication in which case the user is automatically assigned the username no_login_user.

Currently authentication with github is the only option. To setup, ensure that the web service has access to the environment variables
```
GITHUB_OAUTH_CLIENT_ID=11111111111-kjhlskjdfhglskjdf.apps.googleusercontent.com
GITHUB_OAUTH_CLIENT_SECRET=secret
```

The web server uses Flask Dance to implement the oauth flow. Flask dance supports many providers including google, facebook, twitter, ...

[At this time, the google provider fails.   It works to the extent that a code is returned by google however the authorize endpoint fails with invalid client exception ??]


Access to the mqtt server is partitioned by sites. A site corresponds to a mosquitto login user.
The mqtt service has access rules so that an authenticated user can read and write to any topic underneath hermod/theirsiteid/

For example if the user logs in as fred@gmail.com they can connect and subscribe to hermod/fred__gmail_com/asr/text

In the example, the web service generates a password when the user logs in and then uses mosquitto_password to update the mosquitto password file via a shared volume with the mosquitto server.
The mosquitto server runs an additional thread to watch for changes to its password file and send a HUP signal to mosquitto to trigger a reload when the passwords change.
The web server delivers the generated password to the browser client via a templated HTML content.

There is also a global admin user configured in the mosquitto sample files 
- username hermod_server
- password hermod

The admin user credentials are used by the hermod services which listen and respond to messages from many sites (all topics under hermod/)
The admin credentials must be provided as environment variables.

```
MQTT_HOSTNAME: mqtt
MQTT_USER: hermod_server
MQTT_PASSWORD: hermod
MQTT_PORT: 1883    
```


### Docker commands

Using docker-compose to access containers incorporates environment variables.


train the RASA model
note -t argument to services default entrypoint.

```docker-compose run rasa -t```


Start a shell in the running web container

```docker-compose exec -it --entrypoint bash hermodweb```




### SSL

Recent web browsers will not allow access to the microphone unless the connection is made over SSL.
Localhost is an exception so the web site works fine from a browser on the same machine but exposing it to the Internet takes more work.

If using SSL for the webserver, the mosquitto web sockets server must also use SSL.

Certbot can be used to make free certificates if your host is exposed to the Internet.


To enable SSL for both the web service and the mqtt service set the path to the certificates files.

```SSL_CERTIFICATES_FOLDER=/path/to/cert/files```

To enable SSL, three files must be present in this folder
/SSL_CERTIFICATES_FOLDER/cert.pem
/SSL_CERTIFICATES_FOLDER/fullchain.pem
/SSL_CERTIFICATES_FOLDER/privkey.pem


Using docker-compose, SSL_CERTIFICATES_FOLDER is set to /app/certs/. 
Edit docker-compose.yml to host mount a folder to that path in both the mqtt and hermodweb containers.


When services.py starts mosquitto, it checks if the files exist. If they do it rewrites mosquitto-ssl.conf to reflect the path and starts mosquitto using mosquitto-ssl.conf.
If the certificate files are not available, mosquitto starts without SSL.
In both cases, mosquitto web sockets is exposed on port 9001.

The web server serves https on port 443 if the certificate files are available otherwise http on port 80.


### Local Audio



#### Pulse Audio

To enable local audio and hotword services is easiest using the default setup requiring pulse audio.

Depending on your host, you may need to use paprefs or some other method to allow network access to your host pulse audio installation.

To use pulse, the hermod services.py file needs to run with 
- environment variables PULSE_SERVER and PULSE_COOKIE
- access (? volume mount) to cookie file from host

To populate PULSE_SERVER
``` export PULSE_SERVER=`ip -4 route get 8.8.8.8 | awk {'print $7'} | tr -d '\n'`   ```

Because this environment variable is the dynamic result of a command, it cannot be placed in the shared .env file but needs to be set in the host shell that runs docker-compose (and pulse)
(Unless the ip is truly static)

The docker file includes a host volume mount to /$HOME/.pulse/cookie as /tmp/cookie and sets PULSE_COOKIE=/tmp/cookie
``` ${HOME}/.config/pulse/cookie:/tmp/cookie ````


#### PyAudio

It is **possible** to configure hermod to use any ALSA hardware device rather than the default pulse device.

Use environment variables to specify which ALSA hardware device to use.

eg
```
- MICROPHONE_DEVICE=dmix
- SPEAKER_DEVICE=dmix
```

Depending on your ALSA configuration (/etc/asound.conf), different devices may be available.

Hermod requires microphone audio to be delivered as 16000, 1channel. ALSA config allows for virtual remixed devices.

The speaker channel needs to be able to convert from any sound format.

Depending on your configuration, access to the sound card may be restricted to one process (dmix can help)


The docker images includes alsa config files to enable pulse
- ./pulseaudio/asound-pulse.conf        =>  /etc/asound.conf
- ./pulseaudio/client.conf                       => /etc/pulse/client.conf

When using docker without pulse, these files will need to be customised using volume mounts or by rebuilding the image.



### RASA

To train the model when using docker compose.
```docker-compose run rasa -t```


RASA requires URLs to duckling and rasa action services to be specified in the configuration files for your RASA model.

Notably,the duckling URL is built into the RASA model when it is trained.

- **config.yml** specifies the url to duckling
- **entrypoints.yml**  specifies the url to the action server

Hermod uses environment variables in these configuration files to allow dynamic assignment. (Although changes to the duckling url  will require model training)

- **DUCKLING_URL** default http://localhost:8000 set in services.py 
eg
```
  - name: DucklingHTTPExtractor                                                     
    url: ${DUCKLING_URL}  
```



- **RASA_ACTIONS_URL**  default http://localhost:5055 set in services.py 
  eg
```
action_endpoint:
  url: "${RASA_ACTIONS_URL}"
```
If RASA_ACTIONS_URL is present in the environment when starting services.py, the endpoints.yml file is updated to set the action_endpoint.url to match the environment variable.



#### Chatito

Building a good model requires lots of samples. While generation from a DSL runs the risk of overfitting if comprehensive data sets are provided, samples of a generated data set can be helpful in quickly building initial training and testing data. 

In particular entity matching from a large set defined as a lookup file, benefits from (integrating more samples of lookup values)[https://blog.bitext.com/improving-rasas-results-with-artificial-training-data-ii]


To build training data from the chatito files

- Start the services  with ```docker-compose up``` to create a container with the correct environment variables then,

- Start a shell in the rasa container
```docker exec -it -w /app/rasa rasa bash```

- Then build training data, convert to md format and run training
```
cd chatito
python ./buildnlu.py
cd ..
rasa train --data data/stories.md data/nlu.md chatito/nlu.md
```



## Developing with Hermod

It should be straight forward to build a model into the folder hermod-python/rasa/models and use either the local or web versions to speak to the model.

Developing with hermod is mainly developing with RASA. Building/training a model and implementing actions.

By default, dynamic actions are implemented using a local RASA action server. An actions.py file in the rasa folder includes classes that satisfy the Action api.

Any text messages returned by RASA are collated and a hermod/siteid/tts/say message is sent by the dialog manager.

Because hermod runs in the context of an mqtt server, actions can also communicate with the client in real time by sending messages. For example, the action can send an mqtt message 
to the topic hermod/myhsite/tts/say to have speech generated and spoken immediately (eg looking now) while the action continues to collate and process data before giving a final response.


### Client initialisation

The AudioService and the javascript client send an initialisation message `hermod/site>/dialog/init `  with a JSON payload including information about the client including supported features and platform.

The DialogManagerService listens for these messages and sends appropriate activate and start messages for asr, hotword and microphone.

The TTS services also listen for these messages and cache the client information so that clients who have registered via a web platform are sent TTS audio as a url rather than the default of splitting into mqtt audio packets for final reassembly and playback.  Streaming playback using MQTT by reconstructing audio streams is difficult. A web server is designed for the job.

The RASA service also listens for these messages and saves the payload as a slot hermod_client so that the information is available to custom actions to respond based on supported features of the client.

### Automatically restarting the microphone

In a speech dialog, a conversation can end and switch the microphone back to hotword mode OR it can continue and leave the microphone active for a response from a user.

The default is set by the environment variable ```HERMOD_KEEP_LISTENING=true```

More fine tuned control can be applied through stories or custom actions.

When hermod is configured to keep listening, an action_end as the last action in your story will force the microphone to return to the hotword.
```
## say goodbye
* quit
  - utter_goodbye
  - action_end   
```

When hermod is configured not to keep listening, action_continue can be used as the last action to force the microphone to restart for an intent that needs further input

```
## save fact success
* save_fact{"attribute": "meaning","thing": "life","answer": "42"}
    - action_confirm_save_fact
    - slot{"attribute": "meaning"}
    - slot{"thing": "life"}
    - slot{"answer": "42"}
    - action_continue
* affirmative
    - action_save_fact
```

NOTE These actions will need to added to your domain file and enabled for the action server.


Where the story does not force the issue, custom actions can use a slot to force the microphone status. 

```slotsets.append(SlotSet("hermod_force_continue", "true")) ```
or
```slotsets.append(SlotSet("hermod_force_end", "true")) ```

If both slots are set, hermod_force_continue takes precedence.

**NOTE These slots need to be added to your domain file**


For fallback actions, a sample implementation of action_default_fallback is included with the action server that sets the slot to force the microphone to restart.



After a period of silence or failed recognition attempts, the microphone will turn itself back to hotword mode.


#### Fallback Requests

experiment in place - action server provides action_custom_fallback and config.yml includes

```
  - name: "FallbackPolicy"
    nlu_threshold: 0.5
    core_threshold: 0.3
    fallback_action_name: "action_custom_fallback"
```

But NLU confidence scores below 0.5 don't trigger fallback action.


TODO implement intent filters with thresholds




### Logging


```
mosquitto_sub -v -u hermod_server -P  hermod -t hermod/+/dialog/# -t hermod/+/asr/# -t hermod/+/tts/# -t hermod/+/hotword/# -t hermod/+/speaker/# &
mosquitto_sub -v -u hermod_admin -P  talk2mebaby -t hermod/+/dialog/# -t hermod/+/asr/# -t hermod/+/tts/# -t hermod/+/hotword/# -t hermod/+/speaker/# &
mosquitto_sub -v -u hermod_admin -P  thisistalking -t hermod/+/dialog/# -t hermod/+/asr/# -t hermod/+/tts/# -t hermod/+/hotword/# -t hermod/+/speaker/start -t hermod/+/speaker/stop &
```

mosquitto_sub -v -h mqtt -u hermod_admin -P  thisistalking -t hermod/+/dialog/# -t hermod/+/asr/# -t hermod/+/tts/# -t hermod/+/hotword/# -t hermod/+/speaker/start -t hermod/+/speaker/stop &
mosquitto_pub  -h mqtt -u hermod_admin -P  thisistalking -t hermod/hermod_server/asr/text -m '{"text":"what is the date"}'


### Example Web Service

The web service hosts a sample page with oauth login via google. When a user logs in, a password is generated and the mosquitto server password file is updated and reloaded.

If environment variables are set for google oauth, users can login using google to identify themselves.
If not set, the user defaults to no_user_login and all browsers accessing the page will share messages.

The sample web application provides a microphone and UI elements including buttons an iframe and an image.
The sample actions send MQTT hermod/mysite/display messages with parameters for url, image and buttons.
The microphone shows a dialog when the user speaks and when hermod replies.



### Web Client

The hermod web client in hermod-python/www/static/bundle.js provides a vanilla javascript library for starting and stopping hotword and speech recognition/audio streaming.

>To make changes to the library you will need to run watchify to repack.
>```watchify index.js -o static/bundle.js```

*See the example hermod-python/www/index.html  for usage.**


First construct a client with configuration as follows. In the following example, email, password and site are generated from server template variables in python.
```
var config = {
    server: protocol + window.location.hostname + ':' + port, 
    username: "{{data.get('email_clean')}}",
    password: "{{data.get('password')}}",
    subscribe: "hermod/{{data.get('email_clean')}}/#",
    hotwordsensitivity : 0.5    ,
    site:"{{data.get('email_clean')}}"
}
```
then connect and start the hotword service

```
client = new window.HermodWebClient(config)
client.connect().then(function() {
    client.startHotword()
})
```

Once connected the client listens for all messages in its site ie hermod/mysite/#

The client responds to the following messages

- hermod/mysite/asr/text
- 

All messages in the subtopic are available by binding to the message event using the client bind method.
`client.bind('message',function(message,payloadIn) {})`

The client exposes methods including

**volume management**
- setVolume
- muteVolume
- unmuteVolume
 
- playSound
- stopPlaying

- stopAll
- say

**Bind and unbind events including microphoneStart,microphoneStop,hotwordStart,hotwordStop,disconnect,connect,speaking,stopspeaking,message**
- bind
- unbind

- sendAndWaitFor
- sendAudioAndWaitFor
- sendMessage
- sendNLUMessage
- sendASRTextMessage

- connect
- disconnect


- startHotword
- stopHotword
- startMicrophone
- stopMicrophone




### Monitoring

All communication between services is via mqtt so you can monitor by listening for messages

```apt install mosquitto-clients```

To track the conversation progress, use the admin login details and subscribe to a bunch of topics.
```
mqtt_sub -h localhost -u hermod -P -hermod_server  -v -t 'hermod/+/asr/+' -t 'hermod/+/nlu/+' -t 'hermod/+/dialog/+' -t 'hermod/+/hotword/+' -t 'hermod/+/intent' -t 'hermod/+/action' -t 'hermod/+/action/#' -t 'hermod/+/core/#' -t 'hermod/+/tts/#' -t 'hermod/+/speaker/started' -t 'hermod/+/speaker/finished'
```

### Tests

*TODO update test suite to latest image and features.*

The test suite was developed with nodejs and npm. jest is used as a testing library for hermod-nodejs.

The test suite was then used to facilitate development of the python version. 

The tests require a docker image syntithenai/hermod-python to provide hermod in a python 3.7 environment with os dependancies installed and default models installed.

```
cd hermod/tests
npm install
npm test
```



## Hermod MQTT Services

TODO update the following message reference for recent changes


### Dialog ID

Each dialog session is assigned an id which is passed with each subsequent request in the dialog.

An id is created (if missing) when the dialog manager receives  dialog/start, dialog/continue, asr/text, nlu/intent messages.


### Audio Buffers

Both local and web AudioServices buffer captured audio. 

To minimise network traffic, voice detection algorithms are used to enable and disable streaming of audio packets.

When voice detection hears speech, the buffered audio is sent before starting to stream packets.

When voice detection hears no speech for a short period, audio streaming is paused. 





### Media Streaming

The media service can play and record audio on a device and send or receive it from the MQTT bus. 

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



#### Message Reference

**Incoming**

- `hermod/<siteId>/hotword/start`
- `hermod/<siteId>/hotword/stop`

**Outgoing**

- `hermod/<siteId>/hotword/detected`
	- Sent when service is enabled and hotword is detected.
	- JSON message body
		- hotword - identifier for the hotword that was heard.




### Automated Speech Recognition (ASR)

The ASR service converts audio data into text strings. The service listens on the MQTT bus for audio packets. 

When the ASR detects a long silence (XX sec) in the audio stream, the final transcript is sent and the ASR service clears it's audio transcription buffer for the site.

The software provides two alternate ASR services
-  deepspeech local. Less accurate, slower. No Internet required.
-  Google ASR. Faster, more accurate. Requires Internet.

TODO Explore the possibilities of running both concurrently in 'economy mode'  where HD ASR from google is activated after a misunderstanding or explicitly for filling text slots.


From the previous version which included more ASR engines
> 
> ASR is the most computationally expensive element of the protocol. Some of the implementations described below require more processing power and memory than is available on a Raspberry Pi. In particular running multiple offline models is likely to be unresponsive on low power machines.
> 
> Open source implementations of ASR include Kaldi, Mozilla DeepSpeech and PocketSphinx.
> 
> Closed source implementations include Snips, Google and Amazon Transcribe. 
> 
> Snips has the advantage being optimised minimum hardware and for of providing a downloadable model so transcription requests can be run on local devices (including Raspberry Pi). 
> 
> The ASR service allows the use of a suite of ASR processor implementations where each model is customised. The `asrModel` parameter of an ASR start message allows switching between models on the fly. 
> 
> -   Snips provides a reasonable quality general model but works best when the using the web UI to create a specific ASR model. 
> -   Google or Amazon offer the best recognition accuracy because of access to large voice data sets and would be more appropriate for arbitrary transcription.
> -   The open source solutions are not quite as accurate as the commercial offerings [citing WER under 10%](https://hacks.mozilla.org/2017/11/a-journey-to-10-word-error-rate/)  which approaches the human error rate of 5.83 and works very well when combined with NLU.
> 
> Some implementations perform recognition once off on an audio fragment. Other implementations allow for streaming audio and sending intermediate recognition results.
> 
> ASR implementations from Google and Amazon provide punctuation in results.
> 
> Google also implements automatic language(en/fr/jp) detection and provides a request parameter to select background noise environment.
> 
> As at 28/12/18, Amazon and Google charge $0.006 AUD / 15 second chunk of audio.
> 
> Depending on the implementation, the ASR model can be fine tuned to the set of words you want to recognise. 
> 
> -   Snips provides a web UI to build and download models
> -   Google allows phraseHints to be sent with a recognition request.
> -   Amazon offers an API or web UI to develop vocabularies in addition to the general vocabulary.
> -   The open source implementations Deepspeech and Kaldi offer examples of training the ASR model.
> 
> For some implementations, a pool of ASR processors is managed by the service to support multiple concurrent requests. In particular, implementation using Kaldi provides this feature using [gstreamer](https://github.com/alumae/kaldi-gstreamer-server).

#### Message Reference

**Incoming**

- `hermod/<siteId>/asr/start`
    - Start listening for audio to convert to text.
    - JSON body with 
        - id - (optional) unique id sent forwarded with results to help client connect result with original request

- `hermod/<siteId>/asr/stop`
    - Stop listening for audio to convert to text.

**Outgoing**

- `hermod/<siteId>/asr/started`
- `hermod/<siteId>/asr/stopped`

- `hermod/<siteId>/asr/partial`
    - Send partial text results
    - JSON body with
        - id
        - text - transcribed text
  
- `hermod/<siteId>/asr/text`  
    - Send final text results
    - JSON body with 
        -  id 
        -  text - transcribed text
  
    


### Natural Language Understanding (NLU)

The NLU service parses text to intents and variable slots.

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

# TODO doc id

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
    - => hermod/<siteId>/microphone/stop
    - => hermod/<siteId>/tts/say
    -    After hermod/<siteId>/tts/finished
        - => hermod/<siteId></pre>/microphone/start
        - => hermod/<siteId>/asr/start

- `hermod/<siteId>/asr/text`
    - => hermod/<siteId>/nlu/parse

- `hermod/<siteId>/nlu/intent`
    - => hermod/<siteId>/intent
  

- `hermod/<siteId>/dialog/end`
    - The application that is listening for the intent, should send `hermod/<siteId>/dialog/end` when it's action is complete so the dialog manager can garbage collect dialog resources.
    - Respond with 
        -   `hermod/<siteId>/dialog/ended`
        -   `hermod/<siteId>/microphone/start`
        -   `hermod/<siteId>/hotword/start`


### Dialog Manager Overview

The dialog manager is the glue between the services.

Service output messages are consumed by the dialog manager which then sends another message to the next service in the stack.

Because mediation by the dialog manager is required at each step in the dialog flow, it is able to track and control the state of each dialog to ensure valid dialog flow and manage asynchronous collation of dialog components before some stages in the dialog.

In general, a service should send message to let the dialog manager know when it starts and stops.


#### Typical Dialog Flow



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


## Wishlist

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


### Dialog Extensions (TODO)???

The dialog manager tracks when multiple ASR or NLU services of the same type indicate that they have started. It waits for all final responses and selects the highest confidence before sending the next message.

For example, when two ASR services on the same bus share a model key and respond to `hermod/<siteId>/asr/start` sending two `hermod/<siteId>/asr/started` messages,  the dialog manager waits for both to respond with `hermod/<siteId>/asr/text` before sending `hermod/<siteId>/nlu/parse`.

When two NLU services indicate they have started , the dialog manager waits before sending `hermod/<siteId>/intent`.

When Voice ID is enabled, the dialog manager waits for `hermod/<siteId>/voiceid/detected/<userId>`  before sending  `hermod/<siteId>/intent`.

When multiple devices in a room hear an utterance, they all respond at the same time. This affects Google Home, Alexa, Snips and Mycroft. 
Google has elements of a solution because an Android phone will show a notification saying "Answering on another device". Two Google Home devices in a room will both answer.

The hermod protocol with many satellites sharing a dialog service allows the solution that the  hotword server could be debounced. 

When the dialog manager hears 'hermod/<siteId>/hotword/detected' or 'hermod/<siteId>/dialog/start', it waits for a fraction of a second to see if there are any more messages with the same topic, where there are multiple messages, the one with the highest confidence/volume  is selected and the others are ignored.

?? The debounce introduces a short delay between hearing a hotword and starting transcription. To avoid requiring the user pause after the hotword, the ASR needs audio from immediately after the hotword is detected and before transcription is started. To support this, the media server maintains a short ring buffer of audio that is sent before audio data from the hardware. The length of audio that is sent can be controlled by a parameter prependAudio in the JSON body of a message to hermod/<siteId>/microphone/start






## Done

- unify config
  - env, config.yml, args, secrets
  - docker compose
  - SSL
  
  
 ## Todo 
  
- Dockerfile load rasa training data from external repository. 
   
- load testing.

- chomecast web client

- capture training data
    - NLU DONE
    - stories
    - integrate into base training data 
   ``` services.py -t```

- wikipedia example 
    - refine chatito data and rebuild model
    - topic disambiguation
        -  ? wiki disambiguation pages?
    -  rasa two stage fallback with proactive suggest next intent at stage 2.            
    -  example using rasa forms
    -  extend available wikidata attributes
    -  show me (failing display mode ... fallback to wiki lookup page/attribute). eg show me the flag of peru


- local storage of facts. See RASA knowledgebasebot DONE

- HDASR
    - single service that switches between google and deepspeech
        - explicitly triggered by actions for a single following utterance. Useful for capturing arbitrary text to a slot.
        - triggered when NLU fails and calls action_default (or 2 stage fallback)
    - enable Google with daily limits

- auto adjust to ambient volume (per mycroft)



- RASA
    - [multi intents](https://blog.rasa.com/how-to-handle-multiple-intents-per-input-using-rasa-nlu-tensorflow-pipeline/?_ga=2.50044902.1771157212.1575170721-2034915719.1563294018)

## Links

- Contribute to the Mozilla Open Source Voice Dataset)[https://voice.mozilla.org/en/speak]


- Hotwords
  - (picovoice)[https://picovoice.ai/]  (also for web browsers)
  - (snowboy)[https://snowboy.kitt.ai/]

- Automated Speech to Text Recognition  (ASR)
  - (CMUSphinx)[http://cmusphinx.github.io/]
  - (Kaldi)[https://kaldi-asr.org/]
  - (Deepspeech)[https://github.com/mozilla/DeepSpeech]
  - (Facebook  wav2letter)[https://github.com/facebookresearch/wav2letter]

- Text to Speech  (TTS)
  - (pico2wav)[https://packages.debian.org/jessie/libttspico0]
  - (mycroft mimic)[https://mycroft-ai.gitbook.io/docs/mycroft-technologies/mimic-overview]
  - (mycroft mimic 2)[https://github.com/MycroftAI/mimic2#mimic2]
  
- Natural Language Understanding (NLU) Service
  - (RASA)[https://rasa.com/docs/rasa/nlu/about/]
  - (Duckling)[https://github.com/facebook/duckling]
  - (Snips NLU)[https://github.com/snipsco/snips-nlu]
  - (Mycroft Adapt)[https://mycroft-ai.gitbook.io/docs/mycroft-technologies/adapt]
  - (Mycroft Padatious)[https://mycroft-ai.gitbook.io/docs/mycroft-technologies/padatious] 

- NLU Tools
  - (Apache NLP)[https://opennlp.apache.org/]
- (Stanford NLP)[https://stanfordnlp.github.io/CoreNLP/]
  
- Dialog Flow/Routing
  - (RASA Core)[https://rasa.com/docs/rasa/core/about/]

- Other
  -  (RASA Voice Interface)[https://github.com/RasaHQ/rasa-voice-interface]  - Integrate RASA and deepspeech into web browser without intermediate service makes Deepspeech websocket requests and RASA calls from the browser.
  - (JOVO Framework)[https://www.jovo.tech/]
  -(Deepspeech on AWS Serverless)[https://github.com/samfeder/banter-deepspeech/blob/master/serverless.yml]
      - https://medium.com/@lukasgrasse/deploying-mozilla-deepspeech-models-to-aws-lambda-using-serverless-b5405ccd546b
  - https://jasperproject.github.io/documentation/modules/   -   voice module plugins for movies, stocks, ...
  - http://doc.tock.ai/tock/en/ - java/kotlin bot framework 
