#!/bin/bash
apt-get install -y wget
cd deepspeech-model
wget  -qO- -c https://github.com/mozilla/DeepSpeech/releases/download/v0.4.1/deepspeech-0.4.1-models.tar.gz | tar xvz 
