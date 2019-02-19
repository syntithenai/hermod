FROM debian:stable
USER root
WORKDIR /usr/src/app
RUN apt-get update; 
RUN apt-get install -y curl software-properties-common gnupg 
RUN curl -sL https://deb.nodesource.com/setup_11.x |  bash -
# Create app directory
RUN apt-get update && apt-get install -y libpcre++-dev python3 python3-pip  nodejs wget python-pip

COPY ./deepspeech-model ./deepspeech-model
RUN chmod 777 deepspeech-model/install.sh
RUN cd deepspeech-model && ./install.sh

COPY ./mongodb ./mongodb
RUN chmod 777 mongodb/install.sh
RUN chmod 777 mongodb/run.sh
RUN mongodb/install.sh

COPY ./duckling ./duckling
RUN chmod 777 duckling/install.sh
RUN chmod 777 duckling/run.sh
RUN cd duckling && ./install.sh

COPY ./rasa/install.sh ./rasa/install.sh
COPY ./rasa/build.sh ./rasa/build.sh
COPY ./rasa/joke ./rasa/joke

RUN chmod 777 rasa/install.sh
RUN chmod 777 rasa/build.sh
RUN cd rasa && ./install.sh
RUN cd rasa && ./build.sh

# now copy the rest
COPY ./package.json ./
COPY ./ecosystem.config.js ./
COPY ./mosca ./mosca

# SNOWBOY build deps
RUN apt-get install -y alsa-utils libasound2-dev nano libatlas-base-dev libmagic-dev  python-pyaudio python3-pyaudio sox  libpcre3 libpcre3-dev
RUN pip install pyaudio

COPY ./sources.list /etc/apt/sources.list
RUN apt-get update; apt-get install -y libttspico-utils


RUN npm install

RUN npm install pm2 -g
RUN npm install nodemon -g
RUN npm install rollup -g


RUN npm install nan
RUN npm install node-gyp node-pre-gyp


# swig
RUN wget http://downloads.sourceforge.net/swig/swig-3.0.10.tar.gz && tar xzf swig-3.0.10.tar.gz && cd swig-3.0.10 && ./configure --prefix=/usr --without-clisp --without-maximum-compile-warnings && make && make install && install -v -m755 -d /usr/share/doc/swig-3.0.10 && cp -v -R Doc/* /usr/share/doc/swig-3.0.10

RUN cd /tmp; git clone https://github.com/Kitt-AI/snowboy.git; cd snowboy/ ; npm install && ./node_modules/node-pre-gyp/bin/node-pre-gyp clean configure build

RUN apt-get install -y pulseaudio


COPY ./hermod-react-satellite ./hermod-react-satellite
RUN cd hermod-react-satellite; rm -rf node_modules; rm package-lock.json;  npm i
COPY ./browser-example ./browser-example
RUN cd browser-example; rm -rf node_modules; rm package-lock.json;  npm i


COPY ./hermod-nodejs ./hermod-nodejs
RUN cd hermod-nodejs; rm -rf node_modules;   
RUN chmod 777 hermod-nodejs/install.sh
RUN cd hermod-nodejs && ./install.sh 



COPY ./rasa/rasa-core.sh ./rasa/rasa-core.sh
COPY ./rasa/rasa-nlu.sh ./rasa/rasa-nlu.sh
COPY ./rasa/rasa-actions.sh ./rasa/rasa-actions.sh
COPY ./rasa/rasa-nlg.sh ./rasa/rasa-nlg.sh

RUN chmod 777 rasa/rasa-core.sh
RUN chmod 777 rasa/rasa-nlu.sh
RUN chmod 777 rasa/rasa-actions.sh
RUN chmod 777 rasa/rasa-nlg.sh


#RUN rm ./hermod-nodejs/audio*.wav
#CMD [ "bash", "start" ]
ENTRYPOINT pm2 start && pm2 logs
#ENTRYPOINT bash
