docker run --privileged -v /dev/snd:/dev/snd -v /projects/hermod/hermod-python:/app  -p 1883:1883 --entrypoint bash -it syntithenai/hermod-python
 