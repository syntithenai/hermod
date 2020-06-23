import sys
import logging
        
from typing import Any, Text, Dict, List
#
from rasa_sdk import Action, Tracker
from rasa_sdk.executor import CollectingDispatcher
from rasa_sdk.events import SlotSet

# dummy action when using voice interface to signal switch back to active listening
class ActionSearchYoutube(Action):
#
    def name(self) -> Text:
        return "action_search_youtube"
#
    async def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        logger = logging.getLogger(__name__)    
        logger.debug('YT')
        #await publish('hermod/'+site+'/tts/say',{"text":"Looking now"})

        search_term = self.extract_entities(tracker,['thing','person','place','word'])
        #dispatcher.utter_message(text="search youtube")
        # TODO CHECK SLOT CLIENT FOR CAPABILITIES AND REPLY APPROPRIATELY
        #https://www.youtube.com/results?search_query=juggling
        await publish('hermod/'+site+'/display/show',{'frame':'https://www.youtube.com/results?search_query='+search_term})
        # await publish('hermod/'+site+'/display/show',{'question':'Remember that the '+attribute+' of '+thing+' is '+answer})
        # await publish('hermod/'+site+'/display/show',{'buttons':[{"label":'Yes please',"text":'yes please'},{"label":'No thanks',"text":'No thanks'}]})      
        # await publish('hermod/'+site+'/display/show',{'question':'Spell the word '+word})dispatcher.utter_message(text="The "+attribute+" of "+thing+" is "+ result)
        dispatcher.utter_message(text="Done")
        
        return []
        #SlotSet("hermod_force_continue", "true"), SlotSet("hermod_force_end", None)] 
