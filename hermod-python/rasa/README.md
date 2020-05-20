# hermod_agent_wikipedia

This repository provides RASA training data, configuration and actions to support querying wikipedia and wikidata and other tasks., 


Developed as a sample application for the (hermod dialog suite)[https://github.com/syntithenai/hermod].


This repository follows the patterns for a standard RASA project structure and can be imported into RASA-X


This repository uses a custom multi file importer, sourcing NLU training data from a combination of 
- handcrafted (from data/nlu.md), 
- chatito generated (from chatito/nlu.md) and 
- logger captured transcriptions and NLU matches (from logger/nlu.md)

The hermod suite includes a logger to capture training data as text files. Currently text files in the logger directory need to be hand edited for inclusion
in a single refined logger/nlu.md file.



Duckling is required for this application. Set the environment variable DUCKLING_URL in the RASA environment for merging into the config.yml file.

When hermod is used to start RASA, the endpoints file is read and updated so that the action endpoint matches the environment variable RASA_ACTIONS_SERVER. 
This only occurs if the variable is present in the environment.



Note ActionEnd which is used by the hermod suite as a signal to disable speech recognition and return to hotword mode.




NLU parse data from RASA provides an array of entities. 
Each entity object includes information about
- the pipeline stage that extracted the value
- the raw value
- the interpreted value (numbers, dates, synonyms)

Some pipeline stages extract entities according to the training data.
Other pipeline stages like duckling extract entities with names corresponding to a set of fixed data types including email, date, number.

For an action to interpret the incoming NLU data it may need to merge values from a combination of pipeline stages.

For example, in the included MathsAction.py, the action attempts to extract two numeric values using the duckling values in preference and falling back to named entities.



