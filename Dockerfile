FROM debian:stable-slim
USER root
WORKDIR /usr/src/app
RUN apt-get update; 
RUN apt-get install -y curl software-properties-common gnupg 
RUN curl -sL https://deb.nodesource.com/setup_10.x |  bash -
# Create app directory
RUN apt-get install -y nodejs

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./
# Bundle app source
COPY . .
RUN chmod 777 rasa/install.sh
RUN chmod 777 rasa/run.sh
RUN chmod 777 deepspeech-model/install.sh
RUN chmod 777 mongodb/install.sh
RUN chmod 777 mosquitto/install.sh

RUN npm install
# If you are building your code for production
# RUN npm install --only=production


CMD [ "npm", "start" ]