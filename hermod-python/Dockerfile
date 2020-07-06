FROM python:3.7.7-buster
USER root
WORKDIR /app

RUN apt-get update && apt-get install -y  nodejs mosquitto-clients node-libnpx npm ffmpeg  libavcodec-extra mosquitto entr libc-ares-dev libwebsockets-dev libssl-dev  xsltproc docbook-xsl wget curl pulseaudio python3-dev nano libportaudiocpp0 portaudio19-dev alsa-utils libasound2-dev python-pyaudio python3-pyaudio sox && rm -rf /var/lib/apt/lists/*

# for pi4 need 
# RUN apt install libatlas-base-dev libatlas3-base libjlapack-java liblapack-dev liblapack3 liblapacke liblapacke-dev libopenblas-base libopenblas-base-dev liblapack-dev liblapack3 liblapacke liblapacke-dev libtmglib3 libjlapack-java gfortran liblapack-dev musl musl-dev libgfortran4 libgcc1
# also pip install scipy -i https://www.piwheels.org/simples (fails without -i)
# BUT still fails on tensorflow-addons >=0.8 < 0.9 (from rasa requirements) - no such package in default and piwheels (-i)
# https://github.com/piwheels/packages/issues/76

RUN pip install --upgrade pip

COPY ./src/requirements.txt /app

RUN pip install -r requirements.txt

# mosquitto build to get version > 1.6 [which supports websocket max header size settings and avoids connection error bug caused by Flask cookies]
RUN wget -q -O tmpfile https://mosquitto.org/files/source/mosquitto-1.6.9.tar.gz ; tar xzf tmpfile; rm tmpfile;  cd mosquitto-1.6.9; make WITH_WEBSOCKETS=yes; cp ./src/mosquitto /usr/sbin/mosquitto; 
# cd ..; rm -rf mosquitto-1.6.9

# pico2wav install from non-free
RUN wget -q https://ftp-master.debian.org/keys/release-10.asc -O- | apt-key add -
RUN echo "deb http://deb.debian.org/debian buster non-free" >> /etc/apt/sources.list
RUN apt-get update && apt-get install -y libttspico0 libttspico-utils  && rm -rf /var/lib/apt/lists/*

RUN apt-get update; apt install -y  software-properties-common
RUN add-apt-repository -y ppa:certbot/certbot
RUN apt install -y certbot

RUN pip install --upgrade pyunsplash google-api-python-client google-auth google-auth-oauthlib google-auth-httplib2 file_cache beautifulsoup4
#RUN pip install --upgrade pymongo==3.10.0 
#RUN pip install --upgrade metaphone python-Levenshtein wikipedia-api

# copy source code
COPY ./deepspeech-models /app/deepspeech-models
COPY ./rasa /app/rasa

COPY ./src /app/src
COPY ./www /app/www
COPY ./porcupine /app/porcupine
COPY ./mosquitto/ /etc/mosquitto
COPY ./pulseaudio/asound-pulse.conf /etc/asound.conf
COPY ./pulseaudio/client.conf /etc/pulse/client.conf
COPY ./wordset-dictionary /app/wordset-dictionary


ENTRYPOINT [ "python", "./src/hermod.py" ]

