FROM debian:stable-slim
USER root
WORKDIR /usr/src/app
RUN apt-get update; 
RUN apt-get install -y curl software-properties-common gnupg 
RUN curl -sL https://deb.nodesource.com/setup_10.x |  bash -
# Create app directory
RUN apt-get install -y nodejs wget

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./
COPY rasa/*.sh ./rasa/
COPY rasa/package*.json ./rasa/
COPY deepspeech-model/*.sh ./deepspeech-model/
COPY deepspeech-model/package*.json ./deepspeech-model/
COPY mongodb/*.sh ./mongodb/
COPY mongodb/package*.json ./mongodb/
COPY mosquitto/*.sh ./mosquitto/
COPY mosquitto/package*.json ./mosquitto/
COPY hermod-nodejs/package*.json ./hermod-nodejs/
COPY hermod-react-satellite/package*.json ./hermod-react-satellite/

RUN chmod 777 rasa/install.sh
RUN chmod 777 rasa/run.sh
RUN chmod 777 deepspeech-model/install.sh
RUN chmod 777 mongodb/install.sh
RUN chmod 777 mosquitto/install.sh

RUN npm install

# If you are building your code for production
# RUN npm install --only=production

# Bundle app source (do this after npm install so code updates don't require rebuild unless package.json or one of installer packages is changed.
COPY . .
RUN chmod 777 rasa/install.sh
RUN chmod 777 rasa/run.sh
RUN chmod 777 deepspeech-model/install.sh
RUN chmod 777 mongodb/install.sh
RUN chmod 777 mosquitto/install.sh

CMD [ "npm", "start" ]