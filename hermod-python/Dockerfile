FROM python:3.7.7-buster
USER root
WORKDIR /app

RUN apt-get update && apt-get install -y wget python3-dev libportaudiocpp0 portaudio19-dev alsa-utils libasound2-dev python-pyaudio python3-pyaudio sox && rm -rf /var/lib/apt/lists/*

RUN wget -q https://ftp-master.debian.org/keys/release-10.asc -O- | apt-key add -
RUN echo "deb http://deb.debian.org/debian buster non-free" >> /etc/apt/sources.list

RUN apt-get update && apt-get install -y libttspico0 mosquitto libttspico-utils  && rm -rf /var/lib/apt/lists/*


# for pi4 need 
# apt install libatlas-base-dev libatlas3-base liblapack-dev liblapack3 liblapacke liblapacke-dev libtmglib3 libjlapack-java gfortran liblapack-dev musl musl-dev libgfortran4 libgcc1
# also pip install scipy -i https://www.piwheels.org/simples (fails without -i)
# BUT still fails on tensorflow-addons >=0.8 < 0.9 (from rasa requirements) - no such package in default and piwheels (-i)
# https://github.com/piwheels/packages/issues/76

RUN pip install --upgrade pip

COPY ./requirements.txt /app

RUN pip install -r requirements.txt

RUN apt-get update && apt-get install -y pulseaudio  && rm -rf /var/lib/apt/lists/*


# copy source code
COPY ./deepspeech-models /app/deepspeech-models
COPY ./rasa /app/rasa

COPY ./src /app/src
COPY ./porcupine /app/porcupine
COPY ./.asoundrc /root

ENTRYPOINT [ "python", "./src/services.py", "-m" ]

