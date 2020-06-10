import sys
import logging
        
from typing import Any, Text, Dict, List
#
from rasa_sdk import Action, Tracker
from rasa_sdk.executor import CollectingDispatcher
from rasa_sdk.events import SlotSet

# dummy action when using voice interface to signal switch back to hotword mode
class ActionDefault(Action):
#
    def name(self) -> Text:
        return "action_custom_fallback"
#
    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        logger = logging.getLogger(__name__)    
        logger.debug('ACTION_DEFAULT')
        dispatcher.utter_message(text="I didn't really hear your question. Please try again.")
        return [SlotSet("hermod_force_continue", "true")] 
        # logger = logging.getLogger(__name__)    
        # last_entities = tracker.current_state()['latest_message']['entities']
        # answer = 0
        # entities = []
        # slotsets = []
        # # for raw_entity in last_entities:
            # # if raw_entity.get('extractor') == 'DucklingHTTPExtractor':
                # # entity = raw_entity['value']
                # # if (float(entity) - int(entity)) > 0:
                    # # entities.append(float(entity))
                # # else:
                    # # entities.append(int(entity))
        # # if len(entities) > 1:
            # # answer = entities[0] / entities[1]
            # # if (answer - int(answer)) == 0:
                # # answer = int(answer)
            # # dispatcher.utter_message(text=str(entities[0]) + " plus "+str(entities[1])+" is "+str(answer))
            # # slotsets.append(SlotSet("result", str(answer)))
        # # else:
            # # dispatcher.utter_message(text="I didn't hear two numbers. Please try again.")
            
        # return slotsets
        
        
