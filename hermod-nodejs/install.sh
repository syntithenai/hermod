#!/bin/bash
. /etc/profile
npm i 
npm i /tmp/snowboy
npm uninstall snowboy
npm i snowboy

# exit success
echo "all done"
