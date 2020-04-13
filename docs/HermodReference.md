# Audio Server Message Reference

Incoming
hermod/<siteId>/speaker/play
Play the wav file on the matching siteId.
Message contains WAV bytes (Format …...XX) (or mp3 or aac)

hermod/<siteId>/speaker/stop
Stop playing all current audio output.

hermod/<siteId>/speaker/volume
Set the volume for current and future playback.

hermod/<siteId>/microphone/start
Start streaming wav packets from the matching siteId (format below).
! Audio server uses voice activity detection to disable microphone streaming after 4s of silence and restart when voice is detected.

hermod/<siteId>/microphone/stop
Stop streaming wav packets from the matching siteId.


Outgoing
hermod/<siteId>/speaker/playFinished
Sent when the audio from a play request has finished playing on the hardware.

hermod/<siteId>/microphone/audio
Sent continuously when microphone is started.
Message contains audio packet (Format XXX)




# Hotword Message Reference

Incoming

hermod/<siteId>/hotword/start
Start listening for the hotword
hermod/<siteId>/hotword/stop
Stop listening for the hotword

Outgoing
hermod/<siteId>/hotword/detected
Sent when service is enabled and hotword is detected.
JSON message body
hotword - identifier for the hotword that was heard.
hermod/<siteId>/hotword/interrupt 
Sent when service is disabled and hotword is detected.
JSON message body
hotword - identifier for the hotword that was heard.
ASR - (optional) key to identify which ASR model should be used for the rest of the dialog.
NLU - (optional) key to identify which NLU model should be used for the rest of the dialog.



# ASR Message Reference

Incoming

hermod/<siteId>/asr/start
Start listening for audio to convert to text.
model - ASR service/model to use in capturing text (optional default value - default)
requestId - (optional) unique id sent forwarded with results to help client connect result with original request

hermod/<siteId>/asr/stop
Stop listening for audio to convert to text.

Outgoing

hermod/<siteId>/asr/started
hermod/<siteId>/asr/stopped
hermod/<siteId>/asr/partial
Send partial text results
requestId 
text - transcribed text
confidence - ASR transcription confidence
hermod/<siteId>/asr/text
Send final text results
requestId 
text - transcribed text
confidence - ASR transcription confidence




# NLU Message Reference

Incoming

hermod/<siteId>/nlu/query
Convert a  sentence into intents and slots
Parameters
text - sentence to convert into intents and slots
model - name of the model to using in parsing intents and slots
intents - list oMessage Reference

Outgoing messages are shown with => under the related incoming message.

hermod/<siteId>/hotword/detected  
hermod/<siteId>/dialog/start
Start a dialog 
=> hermod/<siteId>/hotword/stop
=> hermod/<siteId>/microphone/start
=> hermod/<siteId>/asr/start
=> hermod/<siteId>/dialog/started/<dialogId>


hermod/<siteId>/dialog/continue
Sent by an action to continue a dialog and seek user input.
text - text to speak before waiting for more user input
ASR Model - ASR model to request
NLU Model - NLU model to request
Intents - Allowed Intents
=> hermod/<siteId>/microphone/stop
=> hermod/<siteId>/tts/say
After hermod/<siteId>/tts/sayFinished
=> hermod/<siteId>/microphone/start
=> hermod/<siteId>/asr/start

hermod/<siteId>/asr/text
Sent by asr service
=> hermod/<siteId>/nlu/query

hermod/<siteId>/nlu/intent
Sent by nlu service
=> hermod/<siteId>/intent
Wait for voiceid if enabled.
OR
=> hermod/<siteId>/nlu/fail 
Sent when entity recognition fails because there are no results of sufficient confidence value.

hermod/<siteId>/dialog/end
The application that is listening for the intent, should sent => hermod/<siteId>/dialog/end when it's action is complete so the dialog manager can
Garbage collect dialog resources.
Respond with 
hermod/<siteId>/dialog/ended
hermod/<siteId>/microphone/start
hermod/<siteId>/hotword/start

Message Reference

Incoming

hermod/<siteId>/hotword/detected
Reduce volume in response to hotword  to optimise ASR.

hermod/<siteId>/hotword/start
Restore previous volume after hotword silencing.

Outgoing

hermod/<siteId>/speaker/volume


f intents that are allowed to match
slot - specific slot to search for 
confidence - intents recognised with confidence less than this value are not recognised and the service replies with hermes/<siteId>/nlu/fail

Outgoing

hermod/<siteId>/nlu/started - sent by service to indicate that parse request was received and parsing has started.
hermod/<siteId>/nlu/intent
Send parsed intent and slots

hermod/<siteId>/nlu/fail 
Send when entity recognition fails because there are no results of sufficient confidence value.




# Dialog Message Reference

Outgoing messages are shown with => under the related incoming message.

hermod/<siteId>/hotword/detected  
hermod/<siteId>/dialog/start
Start a dialog 
=> hermod/<siteId>/hotword/stop
=> hermod/<siteId>/microphone/start
=> hermod/<siteId>/asr/start
=> hermod/<siteId>/dialog/started/<dialogId>


hermod/<siteId>/dialog/continue
Sent by an action to continue a dialog and seek user input.
text - text to speak before waiting for more user input
ASR Model - ASR model to request
NLU Model - NLU model to request
Intents - Allowed Intents
=> hermod/<siteId>/microphone/stop
=> hermod/<siteId>/tts/say
After hermod/<siteId>/tts/sayFinished
=> hermod/<siteId>/microphone/start
=> hermod/<siteId>/asr/start

hermod/<siteId>/asr/text
Sent by asr service
=> hermod/<siteId>/nlu/query

hermod/<siteId>/nlu/intent
Sent by nlu service
=> hermod/<siteId>/intent
Wait for voiceid if enabled.
OR
=> hermod/<siteId>/nlu/fail 
Sent when entity recognition fails because there are no results of sufficient confidence value.

hermod/<siteId>/dialog/end
The application that is listening for the intent, should sent => hermod/<siteId>/dialog/end when it's action is complete so the dialog manager can
Garbage collect dialog resources.
Respond with 
hermod/<siteId>/dialog/ended
hermod/<siteId>/microphone/start
hermod/<siteId>/hotword/start



# Router Message Reference

Incoming

hermod/<siteId>/intent 
Sent by dialog manager after hearing hermes/<siteId>/<dialogId>/nlu/intent 
Parameters
model - name of the model to using in parsing intents and slots
intent - name of the intent
slots - slots for this intent
confidence - confidence value

Outgoing

hermod/<siteId>/action
Action
Last Intent
Template

# App Server Message Reference

Incoming

hermod/<siteId>/action
hermod/<siteId>/intent

Outgoing

hermod/<siteId>/dialog/ended
Sent when action is complete to notify the dialog manager.

hermod/<siteId>/error
Send when there was a problem executing any actions configured for the intent.



# TTS Message Reference

Incoming

hermod/<siteId>/tts/say
Speak the requested text by generating audio and sending it to the media streaming service.
Parameters
text - text to generate as audio
lang - (optional default en_GB)  language to use in interpreting text to audio

hermod/<siteId>/speaker/playFinished
When audio has finished playing send a message to hermod/<siteId>/tts/sayFinished  to notify that speech has finished playing.

Outgoing

hermod/<siteId>/speaker/play/<speechRequestId>
speechRequestId is generated
Body contains WAV data of generated audio.

hermod/<siteId>/tts/sayFinished
Notify applications that TTS has finished speaking.


# Error Message Reference

Incoming

hermod/<siteId>/error
Sent when error could be resolved by user action.
Message is logged and optionally spoken as TTS
message - speakable text describing the error

hermod/<siteId>/exception
Sent when error could not be resolved by user action.
Messages is logged but not spoken.
message - text describing a non resolvable code error. 


Outgoing

hermod/<siteId>/tts/say
text - Error message to be spoken.



Volume Manager Message Reference

Incoming

hermod/<siteId>/hotword/detected
Reduce volume in response to hotword  to optimise ASR.

hermod/<siteId>/hotword/start
Restore previous volume after hotword silencing.

Outgoing

hermod/<siteId>/speaker/volume
