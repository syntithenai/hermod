#!/bin/bash
apt-get -y install git python-pip
pip install rasa
pip install rasa_nlu[spacy]
python -m spacy download en_core_web_md
python -m spacy link en_core_web_md en
pip install rasa_nlu[tensorflow]
git clone https://github.com/RasaHQ/starter-pack-rasa-stack.git
cd starter-pack-rasa-stack
pip install -r requirements.txt

make train-nlu
make train-core
make action-server &
