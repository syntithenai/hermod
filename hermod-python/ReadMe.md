The hermod suite integrates Hotword, Speech to Text, Text to Speech and NLU services into a voice dialog service that can be used to implement your own Alexa/Google Home/Mycroft like device.

The suite is designed to support concurrent access for many users and can be used to build network applications.
The suite is built from a collection of services that communicate through a central MQTT messaging server.

For example a low powered device (pi0) can be deployed with just audio and hotwords services while relying on a central higher powered device to implement processor intensive Speech Recognition and NLU services.

The suite is also suitable for integrating into a nodejs server application and the included React package provides a hotword triggered microphone component to include in your web application.




TODO: The suite is available as a HassIO plugin 

sudo python rasa_x_commands.py create --update admin me <PASSWORD>
