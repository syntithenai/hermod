#!/bin/bash
apt-get install -y mosquitto
cat /etc/mosquitto/mosquitto.conf | grep -v "listener 1883"|grep -v "listener 9001"|grep -v "protocol websockets" > mosquitto.conf
echo listener 1883 >> mosquitto.conf
echo listener 9001 >> mosquitto.conf
echo protocol websockets >> mosquitto.conf
cp mosquitto.conf /etc/mosquitto/mosquitto.conf
rm mosquitto.conf

# stop system startup in favor of pm2
# ubuntu 14+
systemctl stop mosquitto
systemctl disable mosquitto
# alt 
# /etc/init.d/mosquitto stop
#update-rc.d mosquitto remove

#service mosquitto restart


