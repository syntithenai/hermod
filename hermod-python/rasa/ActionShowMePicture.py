import sys
import logging
import pyunsplash
import os
       
from typing import Any, Text, Dict, List
#
from rasa_sdk import Action, Tracker
from rasa_sdk.executor import CollectingDispatcher
from rasa_sdk.events import SlotSet

# dummy action when using voice interface to signal switch back to active listening
class ActionShowMePicture(Action):
#
    def name(self) -> Text:
        return "action_show_me_picture"
#
    def extract_entities(self,tracker,match_entities):
        last_entities = tracker.current_state()['latest_message']['entities']
        for raw_entity in last_entities:
            if raw_entity.get('entity','') in match_entities:
                return raw_entity.get('value','')
            
    async def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        logger = logging.getLogger(__name__)    
        logger.debug('ACTION_ image')
        await publish('hermod/'+site+'/tts/say',{"text":"Looking now"})

        search_term = self.extract_entities(tracker,['thing','person','place'])
        
        pu = pyunsplash.PyUnsplash(api_key=os.env.get('UNSPLASH_ACCESS_KEY'))
        search = pu.search(type_='photos', query=search_term)
        images=[]
        for photo in search.entries:
            print(photo.id, photo.link_download)
            images.push(photo.link_download)
        await publish('hermod/'+site+'/display/show',{'images':images})
        dispatcher.utter_message(text="Done")
        return []
        #return [SlotSet("hermod_force_continue", "true"), SlotSet("hermod_force_end", None)] 
