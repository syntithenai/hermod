## tell me about
* tell_me_about{"thing":"fred"}
  - slot{"thing": "fred"}
  - action_search_wikipedia

## tell me about person
* tell_me_about_person{"person":"fred"}
  - slot{"person": "fred"}
  - action_search_wikipedia
  
## tell me about place
* tell_me_about_place{"place":"fred"}
  - slot{"place": "fred"}
  - action_search_wikipedia
  
## tell me about person attribute
* tell_me_about_person{"person":"fred"}
  - slot{"person": "fred"}
  - slot{"attribute": "fred"}
  - action_search_wikidata
  
## tell me about place  attribute
* tell_me_about_place{"place":"fred"}
  - slot{"place": "fred"}
  - action_search_wikidata
   
## define word
* define{"word":"fred"}
  - slot{"word": "fred"}
  - action_search_wiktionary
  
## spell word
* spell_word{"word":"fred"}
  - slot{"word": "fred"}
  - action_spell_word  
  
  
## ask attribute
* ask_attribute{"attribute":"capital","thing":"Paris"}
  - slot{"attribute": "capital"}
  - slot{"thing": "Paris"}
  - action_search_wikidata
  
## ask follow up attribute
* ask_followup_attribute{"attribute":"population"}
  - slot{"attribute": "population"}
  - action_search_wikidata_followup
  
## tell me more
* tell_me_more
  - action_tell_me_more


## what can i say
* what_can_i_say
  - utter_can_say  


## ask the time
* ask_time
  - action_tell_time

## ask the date
* ask_date
  - action_tell_date
  
## convert units
* convert_units{"from_unit":"degrees","from_unit":"radians"}
  - action_convert_units

## add numbers
* maths_add_numbers
  - action_maths_add_numbers
  - slot{"result": "3"}
  
## subtract numbers
* maths_subtract_numbers
  - action_maths_subtract_numbers
  - slot{"result": "3"}

## multiply numbers
* maths_multiply_numbers
  - action_maths_multiply_numbers
  - slot{"result": "3"}
  
## divide numbers
* maths_divide_numbers
  - action_maths_divide_numbers
  - slot{"result": "3"}

## interactive_story_1
* maths_divide_numbers{"number": "2"}
    - action_maths_divide_numbers
    - slot{"result": "2.5"}

## interactive_story_1
* maths_add_numbers{"number": 4}
    - action_maths_add_numbers
    - slot{"result": "8"}
* maths_add_numbers{"number": "7.2"}
    - action_maths_add_numbers
    - slot{"result": "8"}
    
    
## say goodbye
* quit
  - utter_goodbye
  - action_end    
