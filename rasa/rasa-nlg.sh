#!/bin/bash
python -m rasa_nlu.server --path ./models & python -m rasa_core.run --enable_api -d models/current/dialogue -u models/current/nlu -o out.log 
	