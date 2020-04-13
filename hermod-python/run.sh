#docker kill duckling
#docker rm duckling
#docker run -p 8000:8000 --name duckling rasa/duckling &


docker kill hermodpython
docker rm hermodpython
MYIP=`ip -4 route get 8.8.8.8 | awk {'print $7'} | tr -d '\n'`
DUCKLING_URL="http://$MYIP:8000"
RASA_URL="http://$MYIP:5005"

docker run --name hermodpython -it --privileged -e RASA_URL=$RASA_URL -e DUCKLING_URL=$DUCKLING_URL  -e PULSE_SERVER=$MYIP -e PULSE_COOKIE=/tmp/cookie -v $(pwd)/../pulseaudio/asound-pulse.conf:/etc/asound.conf -v $(pwd)/../pulseaudio/client.conf:/etc/pulse/client.conf -v $(cd ~ && pwd)/.config/pulse/cookie:/tmp/cookie -v $(pwd)/../hermod-python/rasa:/app/rasa  -v /dev/snd:/dev/snd -v $(pwd)/../hermod-python/src:/app/src  -v $(pwd)/../hermod-python/mosquitto:/etc/mosquitto -v $(pwd)/../hermod-web-client:/app/web  -v $(pwd)/../hermod-python/certs:/etc/certs  -v /etc/letsencrypt:/etc/letsencrypt  -v /etc/ssl:/etc/ssl  -v $(pwd)/../hermod-python/www:/app/www    -p 8080:80   -p 8443:443  -p 9001:9001 -p 5005:5005 syntithenai/hermod-python -m -a -w -r http://localhost:5005

 
 
