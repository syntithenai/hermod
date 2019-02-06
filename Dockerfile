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
COPY ./mongodb ./mongodb
COPY ./mosquitto ./mosquitto
COPY ./rasa ./rasa
COPY ./duckling ./duckling

RUN chmod 777 rasa/install.sh
RUN chmod 777 rasa/run.sh
RUN chmod 777 deepspeech-model/install.sh
RUN chmod 777 mongodb/install.sh
RUN chmod 777 mongodb/run.sh
RUN chmod 777 mosquitto/install.sh
RUN chmod 777 mosquitto/run.sh
RUN chmod 777 duckling/install.sh
RUN chmod 777 duckling/run.sh

RUN deepspeech-model/install.sh
RUN chmod 777 duckling/install.sh
RUN rasa/install.sh
RUN mongodb/install.sh
RUN mosquitto/install.sh

# now copy the rest
COPY ./* ./
# and hidden files (git)
# broken COPY ./.* ./
COPY ./hermod-nodejs ./hermod-nodejs
COPY ./hermod-react-satellite ./hermod-react-satellite

RUN npm install
RUN cd hermod-nodejs && npm i
RUN cd hermod-react-satellite && npm i
RUN cd hermod-react-satellite/example && npm i

# If you are building your code for production
# RUN npm install --only=production

# Bundle app source (do this after npm install so code updates don't require rebuild unless package.json or one of installer packages is changed.

CMD [ "npm", "start" ]