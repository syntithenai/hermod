FROM debian:stable
USER root
WORKDIR /usr/src/app

COPY ./sources.list /etc/apt/sources.list
RUN apt-get update && apt-get install -y libttspico-utils curl software-properties-common gnupg libpcre++-dev python3 python3-pip  nodejs wget python-pip alsa-utils libasound2-dev nano libatlas-base-dev libmagic-dev  python-pyaudio python3-pyaudio sox  libpcre3 libpcre3-dev pulseaudio wget git python-pip && rm -rf /var/lib/apt/lists/*

RUN curl -sL https://deb.nodesource.com/setup_10.x |  bash -
RUN apt-get install -y nodejs


# SNOWBOY build deps
RUN pip install pyaudio

COPY ./package.json ./
COPY ./src ./src

RUN npm install

RUN npm install nodemon -g

RUN npm install nan
RUN npm install node-gyp node-pre-gyp

# swig
RUN wget http://downloads.sourceforge.net/swig/swig-3.0.10.tar.gz && tar xzf swig-3.0.10.tar.gz && cd swig-3.0.10 && ./configure --prefix=/usr --without-clisp --without-maximum-compile-warnings && make && make install && install -v -m755 -d /usr/share/doc/swig-3.0.10 && cp -v -R Doc/* /usr/share/doc/swig-3.0.10

RUN cd /tmp; git clone https://github.com/Dabolus/snowboy.git; cd snowboy/ ; npm install && ./node_modules/node-pre-gyp/bin/node-pre-gyp clean configure build
COPY ./install.sh ./install.sh
RUN chmod 777 ./install.sh && ./install.sh 

#COPY ./snowboy /tmp/snowboy
#RUN npm i /tmp/snowboy

ENTRYPOINT nodemon index.js
