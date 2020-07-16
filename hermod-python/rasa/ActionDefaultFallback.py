""" RASA action """
import sys
import logging
        
from typing import Any, Text, Dict, List
#
from rasa_sdk import Action, Tracker
from rasa_sdk.executor import CollectingDispatcher
from rasa_sdk.events import SlotSet

# dummy action when using voice interface to signal switch back to hotword mode
class ActionDefaultFallback(Action):
#
    def name(self) -> Text:
        return "action_default_fallback"
#
    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        logger = logging.getLogger(__name__)    
        logger.debug('ACTION_DEFAULT')
        dispatcher.utter_message(text="I didn't really hear your question. Please try again.")
        return [SlotSet("hermod_force_continue", "true")] 
       
        
