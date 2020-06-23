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
    

## save fact success
* save_fact{"attribute": "meaning","thing": "life","answer": "42"}
    - action_confirm_save_fact
    - slot{"attribute": "meaning"}
    - slot{"thing": "life"}
    - slot{"answer": "42"}
    - action_continue
* affirmative
    - action_save_fact
    
## save fact fail
* save_fact{"attribute": "meaning","thing": "life","answer": "42"}
    - action_confirm_save_fact
    - slot{"attribute": "meaning"}
    - slot{"thing": "life"}
    - slot{"answer": "42"}
    - action_continue
* negative
    - utter_cancelled
