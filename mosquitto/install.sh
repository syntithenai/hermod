#!/bin/bash
sudo apt-get install mosquitto
sudo bash -c 'cat /etc/mosquitto/mosquitto.conf | grep -v "listener 1883"|grep -v "listener 9001"|grep -v "protocol websockets" > mosquitto.conf'
sudo bash -c "echo listener 1883 >> mosquitto.conf"
sudo bash -c "echo listener 9001 >> mosquitto.conf"
sudo bash -c "echo protocol websockets >> mosquitto.conf"
sudo cp mosquitto.conf /etc/mosquitto/mosquitto.conf
sudo service mosquitto restart


