#!/bin/bash
pip3 install rasa
pip3 install rasa_nlu[spacy]
python3 -m spacy download en_core_web_md
python3 -m spacy link en_core_web_md en
pip3 install rasa_nlu[tensorflow]
