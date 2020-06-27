# import IPython
# from IPython.display import clear_output
from rasa.core.agent import Agent
from rasa.core.tracker_store import InMemoryTrackerStore
from rasa.core.interpreter import NaturalLanguageInterpreter
from rasa.core.utils import EndpointConfig
from rasa.core.events import SlotSet
import time
import asyncio

messages = ["Hi! you can chat in this window. Type 'stop' to end the conversation."]
# interpreter = NaturalLanguageInterpreter.create('models/current/nlu')
endpoint = EndpointConfig('http://rasa_actions:5055/webhook')
#, interpreter=interpreter
print('loading model') 
domain = 'domain.yml'
tracker_store = InMemoryTrackerStore(domain)
agent = Agent.load('/app/rasa/models/model.tar.gz', action_endpoint = endpoint, tracker_store=tracker_store)

async def run():
    print("Your bot is ready to talk! Type your messages here or send 'stop'")
    while True:
        a = input()
        if a == 'stop':
            break
            
        nlu = await agent.parse_message_using_nlu_interpreter(a)
        print(nlu)    
        
        responses = await agent.handle_text(a, sender_id='webfred')
        for response in responses:
            print(response["text"])
        
        tracker = tracker_store.get_or_create_tracker('webfred')
        tracker.update(SlotSet("place","JAPAN"))
        tracker_store.save(tracker)
        print(tracker.current_slot_values())

loop = asyncio.get_event_loop()  
loop.run_until_complete(run())
