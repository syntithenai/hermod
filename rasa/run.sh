#!/bin/bash
python3 -m rasa_nlu.server --path ./models & python -m rasa_core.run --enable_api -d models/dialogue -u models/nlu/current -o out.log 