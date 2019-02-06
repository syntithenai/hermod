#!/bin/bash
apt-get install -y mongodb
# stop system startup in favor of pm2
# ubuntu 14+
systemctl stop mongodb
systemctl disable mongodb
# alt 
# /etc/init.d/mongodb stop
#update-rc.d mongodb remove
