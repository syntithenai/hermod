#!/usr/local/bin/python

from rasa.nlu.convert import convert_training_data
from subprocess import call, run
import os

cmd = ['npx chatito --format rasa data/']
p = call(cmd, shell=True, cwd=os.path.dirname(__file__))
                
convert_training_data(data_file="rasa_dataset_training.json", out_file="nlu.md", output_format="md", language="")
