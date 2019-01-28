#!/bin/bash
apt-get install mosquitto
bash -c 'cat /etc/mosquitto/mosquitto.conf | grep -v "listener 1883"|grep -v "listener 9001"|grep -v "protocol websockets" > mosquitto.conf'
bash -c "echo listener 1883 >> mosquitto.conf"
bash -c "echo listener 9001 >> mosquitto.conf"
bash -c "echo protocol websockets >> mosquitto.conf"
cp mosquitto.conf /etc/mosquitto/mosquitto.conf
service mosquitto restart


