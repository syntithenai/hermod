docker kill hermod-python
docker rm hermod-python
docker run --name hermod-python --privileged -v /dev/snd:/dev/snd -v /projects/hermod/hermod-python:/app -p 1883:1883   syntithenai/hermod-python -m
 
