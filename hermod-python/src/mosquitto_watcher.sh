ls /etc/mosquitto/password | entr -p  -s 'echo "restart" ;kill -s HUP `pidof mosquitto`'
