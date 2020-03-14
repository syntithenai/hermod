FROM python:3.7.7-buster
USER root
WORKDIR /app

# copy source code
COPY ./*.py /app/
COPY ./*.yaml /app/
COPY ./requirements.txt /app
COPY ./porcupine /app/

#curl software-properties-common gnupg libpcre++-dev python3 python3-pip  nodejs wget python-pip

RUN apt-get update && apt-get install -y wget  && rm -rf /var/lib/apt/lists/*

RUN wget -q https://ftp-master.debian.org/keys/release-10.asc -O- | apt-key add -
RUN echo "deb http://deb.debian.org/debian buster non-free" >> /etc/apt/sources.list

RUN apt-get update && apt-get install -y libttspico0 alsa-utils libasound2-dev python-pyaudio python3-pyaudio sox  && rm -rf /var/lib/apt/lists/*

RUN apt-get update && apt-get install -y python3-dev libportaudiocpp0 portaudio19-dev
RUN pip install -r requirements.txt




#CMD [ "bash", "start" ]

ENTRYPOINT bash
