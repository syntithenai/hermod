import sys
import logging
        
from typing import Any, Text, Dict, List
from datetime import datetime
        
#
from rasa_sdk import Action, Tracker
from rasa_sdk.executor import CollectingDispatcher
from rasa_sdk.events import SlotSet, FollowupAction

from time import localtime, strftime
##
# MATHS FUNCTIONS
##

class ActionTellTime(Action):
#
    def name(self) -> Text:
        return "action_tell_time"
#
    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        slotsets = []
        dt = datetime.now().strftime("%I:%M %p")
        dispatcher.utter_message(text="The time is {}".format(dt))
        slotsets.append(SlotSet("hermod_force_end", None ))
        slotsets.append(SlotSet("hermod_force_continue","true"))
        return slotsets

class ActionTellDate(Action):
#
    def name(self) -> Text:
        return "action_tell_date"
#
    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        slotsets = []
        dispatcher.utter_message(text="The date is {}".format(strftime("%d %B", localtime())))
        slotsets.append(SlotSet("hermod_force_end", "true"))
        slotsets.append(SlotSet("hermod_force_continue", None))
        return slotsets
 
