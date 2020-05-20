import sys
import logging
        
from typing import Any, Text, Dict, List
#
from rasa_sdk import Action, Tracker
from rasa_sdk.executor import CollectingDispatcher
from rasa_sdk.events import SlotSet
from word2number import w2n
##
# MATHS FUNCTIONS
##
def extract_two_numbers(entities):
    logger = logging.getLogger(__name__)   
    duckling_entities = []
    diet_entities = []
    for raw_entity in entities:
        if raw_entity.get('extractor') == 'DucklingHTTPExtractor':
            entity = raw_entity.get('value')
            # only interested in numbers
            if type(entity) == float:
                duckling_entities.append(entity)
            elif type(entity) == int:
                duckling_entities.append(entity)

        if raw_entity.get('extractor') == 'DIETClassifier':
            entity = raw_entity.get('value')
            # only interested in numbers
            diet_entities.append(float(w2n.word_to_num(entity)))
            
    final_entities = []
    # both from duckling
    if len(duckling_entities) >= 2:
        final_entities = [duckling_entities[0],duckling_entities[0]]
    # single from duckling then skip first diet entity
    elif len(duckling_entities) == 1:
        final_entities.append(duckling_entities[0])
        # skip first diet entity
        if len(diet_entities) >= 2:
            final_entities.append(diet_entities[1])
        elif len(diet_entities) > 0:
            final_entities.append(diet_entities[0])
            
    else:
        final_entities = diet_entities
    logger.debug('duckling_entities')
    logger.debug(duckling_entities)
    logger.debug('diet_entities')
    logger.debug(diet_entities)
    logger.debug('final_entities')
    logger.debug(final_entities)
    return final_entities


class ActionConvertUnits(Action):
#
    def name(self) -> Text:
        return "action_convert_units"
#
    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        dispatcher.utter_message(text="Unit conversion isn't implemented yet.")


class ActionMathsAddNumbers(Action):
#
    def name(self) -> Text:
        return "action_maths_add_numbers"
#
    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        logger = logging.getLogger(__name__)    
        last_entities = tracker.current_state()['latest_message']['entities']
        answer = 0
        slotsets = []
        entities = extract_two_numbers(last_entities)

        if len(entities) > 1:
            answer = entities[0] + entities[1]
            if (answer - int(answer)) == 0:
                answer = int(answer)
            dispatcher.utter_message(text=str(entities[0]) + " plus "+str(entities[1])+" is "+str(answer))
            slotsets.append(SlotSet("result", str(answer)))
        else:
            dispatcher.utter_message(text="I didn't hear two numbers. Please try again.")
            
        return slotsets
 
class ActionMathsSubtractNumbers(Action):
#
    def name(self) -> Text:
        return "action_maths_subtract_numbers"
#
    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:        
        logger = logging.getLogger(__name__)    
        last_entities = tracker.current_state()['latest_message']['entities']
        answer = 0
        slotsets = []
        entities = extract_two_numbers(last_entities)

        if len(entities) > 1:
            answer = entities[0] - entities[1]
            if (answer - int(answer)) == 0:
                answer = int(answer)
            dispatcher.utter_message(text=str(entities[0]) + " minus "+str(entities[1])+" is "+str(answer))
            slotsets.append(SlotSet("result", str(answer)))
        else:
            dispatcher.utter_message(text="I didn't hear two numbers. Please try again.")
            
        return slotsets
 
 
class ActionMathsMultiplyNumbers(Action):
#
    def name(self) -> Text:
        return "action_maths_multiply_numbers"
#
    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        
        logger = logging.getLogger(__name__)    
        last_entities = tracker.current_state()['latest_message']['entities']
        answer = 0
        slotsets = []
        entities = extract_two_numbers(last_entities)

        if len(entities) > 1:
            answer = entities[0] * entities[1]
            if (answer - int(answer)) == 0:
                answer = int(answer)
            dispatcher.utter_message(text=str(entities[0]) + " times "+str(entities[1])+" is "+str(answer))
            slotsets.append(SlotSet("result", str(answer)))
        else:
            dispatcher.utter_message(text="I didn't hear two numbers. Please try again.")
            
        return slotsets
 
 
class ActionMathsDivideNumbers(Action):
#
    def name(self) -> Text:
        return "action_maths_divide_numbers"
#
    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        logger = logging.getLogger(__name__)    
        last_entities = tracker.current_state()['latest_message']['entities']
        answer = 0
        slotsets = []
        entities = extract_two_numbers(last_entities)

        logger.debug(entities)
        if len(entities) > 1:
            answer = entities[0] / entities[1]
            if (answer - int(answer)) == 0:
                answer = int(answer)
            dispatcher.utter_message(text=str(entities[0]) + " divided by "+str(entities[1])+" is "+str(answer))
            slotsets.append(SlotSet("result", str(answer)))
        else:
            dispatcher.utter_message(text="I didn't hear two numbers. Please try again.")
            
        return slotsets
        
        
