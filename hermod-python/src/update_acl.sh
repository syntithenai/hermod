#!/bin/bash
echo $1 
echo $2
echo $0
echo $@
cat /etc/mosquitto/acl-template | sed "s#HERMOD_ROOT_USER#$1#" > /etc/mosquitto/acl
