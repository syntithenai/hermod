FROM debian:stable-slim
USER root
WORKDIR /usr/src/app
RUN apt-get update; 
RUN apt-get install -y curl software-properties-common gnupg 
RUN curl -sL https://deb.nodesource.com/setup_10.x |  bash -
# Create app directory
RUN apt-get install -y nodejs wget

# just copy what is needed to install dependancies
COPY ./deepspeech-model ./deepspeech-model
RUN chmod 777 deepspeech-model/install.sh
RUN cd deepspeech-model && ./install.sh

RUN apt-get update && apt-get install -y libpcre++-dev python3 python3-pip 

COPY ./mongodb ./mongodb
COPY ./mosquitto ./mosquitto
RUN chmod 777 mongodb/install.sh
RUN chmod 777 mongodb/run.sh
RUN chmod 777 mosquitto/install.sh
RUN chmod 777 mosquitto/run.sh
RUN mongodb/install.sh
RUN mosquitto/install.sh

COPY ./duckling ./duckling
RUN chmod 777 duckling/install.sh
RUN chmod 777 duckling/run.sh
RUN cd duckling && ./install.sh

RUN apt-get update &&  apt-get install -y python-pip
COPY ./rasa ./rasa
RUN chmod 777 rasa/install.sh
RUN chmod 777 rasa/rasa-core.sh
RUN chmod 777 rasa/rasa-nlu.sh
RUN chmod 777 rasa/rasa-actions.sh
RUN chmod 777 rasa/rasa-nlg.sh

RUN cd rasa && ./install.sh
RUN cd rasa && ./build.sh

# now copy the rest
COPY ./* ./
# and hidden files (git)
# broken COPY ./.* ./
COPY ./hermod-nodejs ./hermod-nodejs
COPY ./hermod-react-satellite ./hermod-react-satellite

RUN npm install

# If you are building your code for production
# RUN npm install --only=production

# Bundle app source (do this after npm install so code updates don't require rebuild unless package.json or one of installer packages is changed.

CMD [ "pm2", "start" ]