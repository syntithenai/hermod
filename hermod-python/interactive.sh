docker kill duckling
docker rm duckling
docker run -p 8000:8000 --name duckling rasa/duckling &


docker kill hermodpython
docker rm hermodpython
MYIP=`ip -4 route get 8.8.8.8 | awk {'print $7'} | tr -d '\n'`
DUCKLING_URL="http://$MYIP:8000"
docker run -d   --name hermodpython -it --privileged  -e DUCKLING_URL=$DUCKLING_URL  -v $(pwd)/../hermod-python/rasa:/app/rasa  -v $(pwd)/../hermod-python/src:/app/src -p 1883:1883  -p 5055:5055 -p 5005:5005  syntithenai/hermod-python -a -ss

docker exec -it -e DUCKLING_URL=$DUCKLING_URL   -w /app/rasa hermodpython rasa interactive 
 
