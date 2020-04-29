#!/bin/bash
echo $1 
echo $2
echo $0
echo $@
cat /etc/mosquitto/mosquitto-ssl-template.conf | sed "s#SSL_CERTIFICATE_FOLDER#$1#" > /etc/mosquitto/mosquitto-ssl.conf
