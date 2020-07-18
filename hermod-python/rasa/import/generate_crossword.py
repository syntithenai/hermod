import puz
from bs4 import BeautifulSoup
import base64
import json,random, re, time, string
from copy import copy as duplicate
     
import uuid
from math import sqrt
import requests
from bson.objectid import ObjectId
import types  
import motor
import motor.motor_asyncio
import os
import sys
import io
import asyncio
from metaphone import doublemetaphone
from string import ascii_lowercase
from crossword_generator import Crossword, Word
from crossword_mongodb import save_crossword, scrape_mnemo
  
#from cStringIO import StringIO
from PIL import Image, ImageOps, ImageDraw

 
# DESTINATION FORMAT (FOR REACT-CROSSWORD)
# {
        # "across" : {
            # "1" : {
                # "clue" : "capital of australia",
                # "answer" : "canberra",
                # "row" : 0,
                # "col" : 0
            # },
            
def just_alphanum(val):
    return re.sub('[^A-Za-z0-9]+', '', val)  
    
def last_word(sentence):
    parts = sentence.split(" ")
    return re.sub('[^A-Za-z0-9]+', '', parts[len(parts)-1])   
    
def strip_after_bracket(text):
    parts = text.split("(")
    return parts[0]  

def strip_after_slash(text):
    parts = text.split("/")
    return parts[0]     

def first_token_comma(sentence):                 
    parts = sentence.split(",")
    return parts[0]

def first_token_space(sentence):                 
    parts = sentence.split(" ")
    return parts[0]

            
# multiplechoice_question_queries = [
# {topic:'English Vocab (junior high school) 101',word: lambda record:last_word(record.get('question')), clue: lambda record:record.get('answer')}
# # {topic:'English Vocab (junior high school) 102',word: function(record) { return last_word(record.get('question'))}, clue: function() { return record.get('answer')}},
# # {topic:'English Vocab (junior high school) 103',word: function(record) { return last_word(record.get('question'))}, clue: function() { return record.get('answer')}},
# # {topic:'English Vocab (junior high school) 104',word: function(record) { return last_word(record.get('question'))}, clue: function() { return record.get('answer')}},
# # {topic:'English Vocab (junior high school) 105',word: function(record) { return last_word(record.get('question'))}, clue: function() { return record.get('answer')}},
# # {topic:'English Vocab (junior high school) 106',word: function(record) { return last_word(record.get('question'))}, clue: function() { return record.get('answer')}},
# # {topic:'English Vocab (junior high school) 107',word: function(record) { return last_word(record.get('question'))}, clue: function() { return record.get('answer')}},
# # {topic:'English Vocab (junior high school) 108',word: function(record) { return last_word(record.get('question'))}, clue: function() { return record.get('answer')}},
# # {topic:'English Vocab (junior high school) 109',word: function(record) { return last_word(record.get('question'))}, clue: function() { return record.get('answer')}},
# # {topic:'English Vocab (junior high school) 110',word: function(record) { return last_word(record.get('question'))}, clue: function() { return record.get('answer')}},
# # {topic:'English Vocab (junior high school) 111',word: function(record) { return last_word(record.get('question'))}, clue: function() { return record.get('answer')}},
# # {topic:'English Vocab (junior high school) 112',word: function(record) { return last_word(record.get('question'))}, clue: function() { return record.get('answer')}},
# # {topic:'English Vocab (junior high school) 113',word: function(record) { return last_word(record.get('question'))}, clue: function() { return record.get('answer')}},
# # {topic:'English Vocab (senior high school) 10',word: function(record) { return last_word(record.get('question'))}, clue: function() { return record.get('answer')}},
# # {topic:'English Vocab (senior high school) 10',word: function(record) { return last_word(record.get('question'))}, clue: function() { return record.get('answer')}},
# # {topic:'English Vocab (senior high school) 101',word: function(record) { return last_word(record.get('question'))}, clue: function() { return record.get('answer')}},
# # {topic:'English Vocab (senior high school) 102',word: function(record) { return last_word(record.get('question'))}, clue: function() { return record.get('answer')}},
# # {topic:'English Vocab (senior high school) 103',word: function(record) { return last_word(record.get('question'))}, clue: function() { return record.get('answer')}},
# # {topic:'English Vocab (senior high school) 104',word: function(record) { return last_word(record.get('question'))}, clue: function() { return record.get('answer')}},
# # {topic:'English Vocab (senior high school) 105',word: function(record) { return last_word(record.get('question'))}, clue: function() { return record.get('answer')}},
# # {topic:'English Vocab (senior high school) 106',word: function(record) { return last_word(record.get('question'))}, clue: function() { return record.get('answer')}},
# # {topic:'English Vocab (senior high school) 107',word: function(record) { return last_word(record.get('question'))}, clue: function() { return record.get('answer')}},
# # {topic:'English Vocab (senior high school) 108',word: function(record) { return last_word(record.get('question'))}, clue: function() { return record.get('answer')}},
# # {topic:'English Vocab (senior high school) 109',word: function(record) { return last_word(record.get('question'))}, clue: function() { return record.get('answer')}},


# ]


question_queries = []

 
async def run(): 
    author = 'Captain Mnemo'
    copyrighttext = 'Public Domain'
    copyright_link = "http://mnemolibrary.com"
    link = "http://mnemolibrary.com"
    country = "AU"

    queries = [
    {
    'table':'multiplechoicequestions',
    'queryFilter':{'topic':{'$regex':'junior high school'}},
    'word': lambda record:last_word(record.get('question')), 
    'clue': lambda record:record.get('answer'), 
    'author':lambda record:author,
    'copyright':lambda record:copyrighttext,
    'copyright_link':lambda record:copyright_link,
    'link':lambda record:'https://mnemolibrary.com/multiplechoicequestions/'+record.get('topic',''),
    'suggestions': lambda record:[], 
    'medialink': lambda record:'', 
    'autoshow_media': lambda record:'false',
    'infolink': lambda record:'https://mnemolibrary.com/discover/topic/'+record.get('topic')+'/'+str(record.get('questionId')), 
    'extraclue': lambda record:'', 
    #'title': lambda record:record:record.get('topic'), 
    'title': lambda record:'English Vocab (Junior High School) ', 
    'answer': lambda record:record.get('answer',''), 
    'difficulty':13,
    'width': 15,
    'height': 15,
    'country': country
    },
      {
    'table':'multiplechoicequestions',
    'queryFilter':{'topic':{'$regex':'senior high school'}},
    'word': lambda record:last_word(record.get('question')), 
    'clue': lambda record:record.get('answer'), 
    'author':lambda record:author,
    'copyright':lambda record:copyrighttext,
    'copyright_link':lambda record:copyright_link,
    'link':lambda record:'https://mnemolibrary.com/multiplechoicequestions/'+record.get('topic',''),
    'suggestions': lambda record:[], 
    'medialink': lambda record:'', 
    'autoshow_media': lambda record:'false',
    'infolink': lambda record:'https://mnemolibrary.com/discover/topic/'+record.get('topic')+'/'+str(record.get('questionId')), 
    'extraclue': lambda record:'', 
    #'title': lambda record:record:record.get('topic'), 
    'title': lambda record:'English Vocab (Senior High School) ', 
    'answer': lambda record:record.get('answer',''), 
    'difficulty':14,
    'width': 15,
    'height': 15,
    'country': country
    }
   
    ,
    {
    'table':'questions',
    'queryFilter':{'quiz':{'$regex':'Capital Cities'}},
    'clue': lambda record:strip_after_bracket(first_token_comma(record.get('specific_answer')))+' is the capital of ...?', 
    'word': lambda record:last_word(record.get('specific_question')) , 
    'author':lambda record:author,
    'copyright':lambda record:copyrighttext,
    'copyright_link':lambda record:copyright_link,
    'link':lambda record:'https://mnemolibrary.com/discover/topic/Capital Cities',
    'suggestions': lambda record:[], 
    'medialink': lambda record:record.get('image'), 
    'autoshow_media': lambda record:'true', 
    'infolink': lambda record:'https://mnemolibrary.com/discover/topic/'+str(record.get('quiz',''))+'/'+str(record.get('_id','')), 
    'extraclue': lambda record:record.get('mnemonic',''), 
    #'title': lambda record:record:record.get('topic'), 
    'title': lambda record:'Capital Cities ', 
    'answer': lambda record:record.get('answer',''), 
    'difficulty':3,
    'width': 15,
    'height': 15,
    'country': country
    }
    ,
    {
    'table':'questions',
    'queryFilter':{"$and":[{'quiz':{"$regex":"World History 1"}},{"mnemonic":{"$exists":True, '$nin': [ '',None ] }}]},
    'clue': lambda record:record.get('mnemonic').replace(strip_after_bracket(record.get('question')),'....'), 
    'word': lambda record:strip_after_bracket(record.get('question')).replace(' ','').replace('the',''), 
    'author':lambda record:author,
    'copyright':lambda record:copyrighttext,
    'copyright_link':lambda record:copyright_link,
    'link':lambda record:'https://mnemolibrary.com/discover/topic/'+str(record.get('quiz','')),
    'suggestions': lambda record:[], 
    'medialink': lambda record:record.get('image'), 
    'autoshow_media': lambda record:'false', 
    'infolink': lambda record:'https://mnemolibrary.com/discover/topic/'+str(record.get('quiz',''))+'/'+str(record.get('_id','')), 
    'extraclue': lambda record:record.get('answer',''), 
    #'title': lambda record:record:record.get('topic'), 
    'title': lambda record:'World History', 
    'answer': lambda record:record.get('answer',''), 
    'difficulty':4,
    'width': 20,
    'height': 20,
    'country': country
    }
    
     ,
    {
    'table':'questions',
    'queryFilter':{"$and":[{'quiz':{"$regex":"Colour Names"}}]},
    'clue': lambda record:record.get('question'), 
    'word': lambda record:just_alphanum(strip_after_slash(strip_after_bracket(record.get('answer')))), 
    'author':lambda record:author,
    'copyright':lambda record:copyrighttext,
    'copyright_link':lambda record:copyright_link,
    'link':lambda record:'https://mnemolibrary.com/discover/topic/'+str(record.get('quiz','')),
    'suggestions': lambda record:record.get('multiple_choices','').split("|||"), 
    'medialink': lambda record:record.get('image'), 
    'autoshow_media': lambda record:'true', 
    'infolink': lambda record:'https://mnemolibrary.com/discover/topic/'+str(record.get('quiz',''))+'/'+str(record.get('_id','')), 
    'extraclue': lambda record:record.get('answer',''), 
    #'title': lambda record:record:record.get('topic'), 
    'title': lambda record:'Colour Names', 
    'answer': lambda record:record.get('answer',''), 
    'difficulty':12,
    'width': 20,
    'height': 20,
    'country': country
    }
      ,
    {
    'table':'multiplechoicequestions',
    'queryFilter':{"topic":"Food Plant Origins For Beginners"},
    'clue': lambda record:record.get('question'), 
    'word': lambda record:just_alphanum(record.get('answer','').lower()), 
    'author':lambda record:author,
    'copyright':lambda record:copyrighttext,
    'copyright_link':lambda record:copyright_link,
    'link':lambda record:'https://mnemolibrary.com/discover/topic/'+str(record.get('quiz','')),
    'suggestions': lambda record:record.get('multiple_choices','').split("|||"), 
    'medialink': lambda record:record.get('image'), 
    'autoshow_media': lambda record:"false", 
    'infolink': lambda record:'https://mnemolibrary.com/discover/topic/'+str(record.get('quiz',''))+'/'+str(record.get('_id','')), 
    'extraclue': lambda record:record.get('feedback',''), 
    #'title': lambda record:record:record.get('topic'), 
    'title': lambda record:'Food Plant Origins For Beginners', 
    'answer': lambda record:record.get('answer',''), 
    'difficulty':1,
    'width': 15,
    'height': 15,
    'country': country
    }
    ,
      {
    'table':'questions',
    'queryFilter':{"$and":[{'quiz':{"$regex":"Ancient Rome for Beginners"}}]},
    'clue': lambda record:record.get('specific_question'), 
    'word': lambda record:just_alphanum(strip_after_slash(strip_after_bracket(first_token_space(record.get('specific_answer').replace('the',''))))), 
    'author':lambda record:author,
    'copyright':lambda record:copyrighttext,
    'copyright_link':lambda record:copyright_link,
    'link':lambda record:'https://mnemolibrary.com/discover/topic/'+str(record.get('quiz','')),
    'suggestions': lambda record:record.get('multiple_choices','').split("|||"), 
    'medialink': lambda record:record.get('image'), 
    'autoshow_media': lambda record:'false', 
    'infolink': lambda record:'https://mnemolibrary.com/discover/topic/'+str(record.get('quiz',''))+'/'+str(record.get('_id','')), 
    'extraclue': lambda record:record.get('mnemonic',''), 
    'title': lambda record:record.get('quiz',''), 
    'answer': lambda record:record.get('answer',''), 
    'difficulty':12,
    'width': 20,
    'height': 20,
    'country': country,
    'cutoff':2,
    }
    #
    ,
               {
        'table':'questions',
        'queryFilter':{"$and":[{'quiz':{"$regex":"Constellation Meanings"}}]},
        'word': lambda record:record.get('question'), 
        # 
        #  
        'clue': lambda record:record.get('answer').replace(record.get('question').lower(), '...').replace(record.get('question'), '...'), 
        'author':lambda record:author,
        'copyright':lambda record:copyrighttext,
        'copyright_link':lambda record:copyright_link,
        'link':lambda record:'https://mnemolibrary.com/discover/topic/'+str(record.get('quiz','')),
        'suggestions': lambda record:record.get('multiple_choices','').split("|||"), 
        'medialink': lambda record:resize_base64_image(record.get('image'),150,150), 
        'autoshow_media': lambda record:'false', 
        'infolink': lambda record:'https://mnemolibrary.com/discover/topic/'+str(record.get('quiz',''))+'/'+str(record.get('_id','')), 
        'extraclue': lambda record:record.get('mnemonic',''), 
        'title': lambda record:record.get('quiz',''), 
        'answer': lambda record:record.get('answer',''), 
        'difficulty':4,
        'width': 20,
        'height': 20,
        'country': country,
        'cutoff':8,
        }
    ,
           {
    'table':'questions',
    'queryFilter':{"$and":[{'quiz':{"$regex":"NATO Phonetic Alphabet"}}]},
    'word': lambda record:just_alphanum(record.get('answer')), 
    # 
    #  
    'clue': lambda record:record.get('question'), 
    'author':lambda record:author,
    'copyright':lambda record:copyrighttext,
    'copyright_link':lambda record:copyright_link,
    'link':lambda record:'https://mnemolibrary.com/discover/topic/'+str(record.get('quiz','')),
    'suggestions': lambda record:record.get('multiple_choices','').split("|||"), 
    'medialink': lambda record:resize_base64_image(record.get('image'),150,150), 
    'autoshow_media': lambda record:'false', 
    'infolink': lambda record:'https://mnemolibrary.com/discover/topic/'+str(record.get('quiz',''))+'/'+str(record.get('_id','')), 
    'extraclue': lambda record:record.get('mnemonic',''), 
    'title': lambda record:record.get('quiz',''), 
    'answer': lambda record:record.get('answer',''), 
    'difficulty':2,
    'width': 20,
    'height': 20,
    'country': country,
    'cutoff':8,
    }
   
    ]
    
    for config in queries:
        print('CONF')
        print(config)

        result = await scrape_mnemo(config.get('table'),config.get('queryFilter'),config)
        print('RES')
        print(result)
        
        if result and not result == None:
            word_and_clue = []
            for r in result:
                # print("EC"+r.get('extraclue',''))
                if r.get('word') and r.get('clue'):
                    word_and_clue.append([r.get('word'),r.get('clue'),r.get('extraclue',''),r.get('infolink',''),r.get('medialink',''),r.get('suggestions',[]),r.get('autoshow_media','')]) 
            
            generated = generate_crosswords(config.get('width'),config.get('height'),word_and_clue,config.get('cutoff',10))
            print('GEN')
            print(generated)
            i=0
            for crossword in generated:
                append_title=''
                if (i > 0) :
                    append_title=' ' +str(i+1)
                final = {
                  "import_id":uuid.uuid4().hex,
                  "title":r.get('title')+append_title,
                  "author":r.get('author'),
                  "copyright":r.get('copyright'),
                  "copyright_link":r.get('copyright_link'),
                  "data":crossword,
                  "difficulty":config.get('difficulty'),
                  "country":config.get('country'),
                  "link":r.get('link'),
                }
                # print(crossword)
                print("==========================================================   ")
                i = i + 1
                await save_crossword(final)
            
        
        
    # await save_crossword(final)
    
def generate_crosswords(width,height,word_list,cutoff):   
    crosswords = [] 
    # hypotenuse = int(sqrt(width*width + height*height))
    # print(['hyp',str(hypotenuse)],width,height,height*height)
    last_fitted = len(word_list)
    print("GENERATE")
    print(word_list)
    # max_repeats = int(len(word_list)/hypotenuse) + 1
    i = 0
    while len(word_list) >= last_fitted -1 and len(word_list) > cutoff and last_fitted >= cutoff:#and max_repeats > 0:
        print("GENERATE LOOP")
        # max_repeats = max_repeats - 1
        i = i + 1
        a = Crossword(width, height, '-', 30000, word_list)
        a.compute_crossword(60,8)
        # a.word_bank()
        # a.solution()
        # a.word_find()
        a.display()
        print (len(a.current_word_list), 'out of', len(word_list))
        #print (a.debug)
        words,data = a.json()
        print(data)
        last_fitted=len(words)
        crosswords.append(data)
        new_wordlist = []
        for word in word_list:
            # print(word[0].lower())
            cleanword = "{}".format(word[0]).lower()
            if not cleanword in words:
                new_wordlist.append(word)
                
        print(['UPDATED WL',last_fitted,len(words),len(word_list),len(new_wordlist)])
        word_list = new_wordlist
    # print (a.json())
    return crosswords



def resize_base64_image(my_image,width,height):
    print('resize')
    if my_image.startswith('http'):
        return my_image
    # return None
    size = (width,height)
    mask = Image.new('L', size, 0)
    draw = ImageDraw.Draw(mask)
    draw.rectangle((0, 0) + size, fill=255)

    # From base64 to PIL
    try:
        image_string = io.StringIO(str(base64.b64decode(my_image)))   #str(my_image[22:]).decode('base64')) # 
        im = Image.open(image_string)
        output = ImageOps.fit(im, mask.size, centering=(0.5, 0.5))
        output.putalpha(mask)

        # From PIL to base64
        output2 = io.StringIO()
        output.save(output2, format='PNG')
        im_data = output2.getvalue()
        # im_data = im_data.encode('base64')
        data_url = 'data:image/png;base64,' + im_data.encode('base64')
        return data_url
    except Exception as e:
        print('FAILED IMAGE PROCESSING')
        print(e)
asyncio.run(run())  
#run()


# async def import_puz(data_in,link,url):
    # data={"across":{}, "down":{}}    
    # #puzzle = f.read('beans.puz')
    # # link='../src/beans.puz'
    # p = puz.load(data_in)
    # numbering = p.clue_numbering()
    # # print(numbering.across) 
    # # print('GRID')   
    # # print([p.width,p.height])   
    # # print([numbering.width,numbering.height])   
    # # print ('Across')
    # for clue in numbering.across:
        # answer = ''.join(
            # p.solution[clue['cell'] + i]
            # for i in range(clue['len']))
        # #print (clue['num'], clue['clue'], '-', answer)
        # # print (clue)
        # row = clue['cell'] // (numbering.width-1) 
        # col = clue['cell'] % numbering.width 
        # data["across"][str(clue['num'])] = {"clue":clue['clue'],"answer":answer.lower(),"row":row,"col":col}

    # for clue in numbering.down:
        # answer = ''.join(
        # p.solution[clue['cell'] + i * numbering.width]
        # for i in range(clue['len']))
        # #print (clue['num'], clue['clue'], '-', answer)
        # # print (clue)
        # row = clue['cell'] // (numbering.width-1) 
        # col = clue['cell'] % numbering.width 
        # data["down"][str(clue['num'])] = {"clue":clue['clue'],"answer":answer.lower(),"row":row,"col":col}
    # # print(data["across"])
    # # print("=================================================")
    # # print(data["down"])
    
    # final = {
      # "import_id":uuid.uuid4().hex,
      # "title":p.title,
      # "author":p.author,
      # "copyright":p.copyright,
      # "copyright_link":url,
      # "data":data,
      # "difficulty":2,
      # "country":"US",
      # "link":link
    # }
    # await save_crossword(final)
    # print("==================SAVED===============================")
    
    
# async def run():
    # # a = 300
    # # while a < 900:
        # # a = a + 1
        # # await scrape('https://www.brendanemmettquigley.com/medium/page/'+str(a)+'/')
    
    # # a = 300
    # # while a < 900:
        # # a = a + 1
        # # await scrape('https://www.brendanemmettquigley.com/easy/page/'+str(a)+'/')
        # # await scrape('https://www.brendanemmettquigley.com/hard/page/'+str(a)+'/')
    
    # # await scrape('http://gridsthesedays.blogspot.com/')
    # # await scrape('#https://www.private-eye.co.uk/sections.php?section_link=crossword&')
    # # await scrape('https://tmcaylifeasapuzzle.wordpress.com/category/puzzles/')
    # # await scrape('https://pmxwords.com/2020-contest-puzzles/')
    # # await scrape('https://crosswordfiend.com/download/')
    # # await scrape('https://web.archive.org/web/20191017043942/http://www.macnamarasband.com/dlpuz.html')
    
# async def scrape(url):
    # url_parts = url.split('/')
    # clean_url = "/".join(url_parts[:-1])
    # print(clean_url)
    # response = requests.get(url)
    # links_page = response.text
    # # print(response.text)
    # soup = BeautifulSoup(links_page, "html.parser")
    # a=1000
    # for link in soup.find_all('a'):
        # # print('LINK')
        # # print(link)
        # if link.get('href',False):
            # if a <= 0:
                # break;
            # final_link = link.get('href','')
            # # print(link.get('href'))
            # # relative links
            # if not link.get('href','').startswith('http://') and not link.get('href','').startswith('https://') :
                # final_link = clean_url + '/' + link.get('href','')
                # # print(final_link)
            
            # # href=link.get('href')
            # if final_link.endswith('.puz'):
                # response = requests.get(final_link)
                # print(final_link)
                # try :
                    # await import_puz(response.content,final_link,url)
                # except Exception as e:
                    # print(e)
                    # pass
                # a = a - 1
        
          

  
# optional, speeds up by a factor of 4
# import psyco
# psyco.full()
 
 
### end class, start execution
 
#start_full = float(time.time())
 
# print (a.legend())
# print (len(a.current_word_list), 'out of', len(word_list))
# print (a.debug)
#end_full = float(time.time())
#print end_full - start_full
# word_list = (['saffron', 'The dried, orange yellow plant used to as dye and as a cooking spice.'], \
    # ['pumpernickel', 'Dark, sour bread made from coarse ground rye.'], \
    # ['leaven', 'An agent, such as yeast, that cause batter or dough to rise..'], \
    # ['coda', 'Musical conclusion of a movement or composition.'], \
    # ['paladin', 'A heroic champion or paragon of chivalry.'], \
    # ['syncopation', 'Shifting the emphasis of a beat to the normally weak beat.'], \
    # ['albatross', 'A large bird of the ocean having a hooked beek and long, narrow wings.'], \
    # ['harp', 'Musical instrument with 46 or more open strings played by plucking.'], \
    # ['piston', 'A solid cylinder or disk that fits snugly in a larger cylinder and moves under pressure as in an engine.'], \
    # ['caramel', 'A smooth chery candy made from suger, butter, cream or milk with flavoring.'], \
    # ['coral', 'A rock-like deposit of organism skeletons that make up reefs.'], \
    # ['dawn', 'The time of each morning at which daylight begins.'], \
    # ['pitch', 'A resin derived from the sap of various pine trees.'], \
    # ['fjord', 'A long, narrow, deep inlet of the sea between steep slopes.'], \
    # ['lip', 'Either of two fleshy folds surrounding the mouth.'], \
    # ['lime', 'The egg-shaped citrus fruit having a green coloring and acidic juice.'], \
    # ['mist', 'A mass of fine water droplets in the air near or in contact with the ground.'], \
    # ['plague', 'A widespread affliction or calamity.'], \
    # ['yarn', 'A strand of twisted threads or a long elaborate narrative.'], \
    # ['kitten', 'A strand of twisted threads or a long elaborate narrative.'], \
    # ['horse', 'A strand of twisted threads or a long elaborate narrative.'], \
    # ['dog', 'A strand of twisted threads or a long elaborate narrative.'], \
    # ['cat', 'A strand of twisted threads or a long elaborate narrative.'], \
    # ['chicken', 'A strand of twisted threads or a long elaborate narrative.'], \
    # ['snicker', 'A snide, slightly stifled laugh.'])



# ,
    
    # {
    # 'COMMENT':'GENERATES SINGLE DIAGONAL LINE',
    # 'table':'questions',
    # 'queryFilter':{"$and":[{'quiz':{"$regex":"Two Letter Words For Scrabble"}}]},
    # 'clue': lambda record:strip_after_bracket(record.get('answer','').lower().replace(strip_after_bracket(record.get('question').lower()),'....')), 
    # 'word': lambda record:just_alphanum(strip_after_bracket(record.get('question')).replace(' ','').replace('the','')), 
    # 'author':lambda record:author,
    # 'copyright':lambda record:copyrighttext,
    # 'copyright_link':lambda record:copyright_link,
    # 'link':lambda record:'https://mnemolibrary.com/discover/topic/'+str(record.get('quiz','')),
    # 'suggestions': lambda record:[], 
    # 'medialink': lambda record:record.get('image'), 
    # 'autoshow_media': lambda record:'false', 
    # 'infolink': lambda record:'https://mnemolibrary.com/discover/topic/'+str(record.get('quiz',''))+'/'+str(record.get('_id','')), 
    # 'extraclue': lambda record:record.get('answer',''), 
    # #'title': lambda record:record:record.get('topic'), 
    # 'title': lambda record:'Two Letter Scrabble Words', 
    # 'answer': lambda record:record.get('answer',''), 
    # 'difficulty':12,
    # 'width': 30,
    # 'height': 30,
    # 'country': country,
    # 'cutoff': 15
    # }
 # ,
           # {
    # 'table':'questions',
    # 'queryFilter':{"$and":[{'quiz':{"$regex":"Space for Beginners"}}]},
    # 'word': lambda record:just_alphanum(record.get('specific_answer')), 
    # # 
    # #  
    # 'clue': lambda record:record.get('specific_question'), 
    # 'author':lambda record:author,
    # 'copyright':lambda record:copyrighttext,
    # 'copyright_link':lambda record:copyright_link,
    # 'link':lambda record:'https://mnemolibrary.com/discover/topic/'+str(record.get('quiz','')),
    # 'suggestions': lambda record:record.get('multiple_choices','').split("|||"), 
    # 'medialink': lambda record:resize_base64_image(record.get('image'),150,150), 
    # 'autoshow_media': lambda record:'false', 
    # 'infolink': lambda record:'https://mnemolibrary.com/discover/topic/'+str(record.get('quiz',''))+'/'+str(record.get('_id','')), 
    # 'extraclue': lambda record:record.get('mnemonic',''), 
    # 'title': lambda record:record.get('quiz',''), 
    # 'answer': lambda record:record.get('answer',''), 
    # 'difficulty':3,
    # 'width': 20,
    # 'height': 20,
    # 'country': country,
    # 'cutoff':3,
    # }
 # ,
       # {
    # 'table':'questions',
    # 'queryFilter':{"$and":[{'quiz':{"$regex":"Australian Animals"}}]},
    # 'clue': lambda record:'What animal is ' + record.get('question'), 
    # 'word': lambda record:just_alphanum(record.get('facts', {}).get('commonName', '')), 
    # 'author':lambda record:author,
    # 'copyright':lambda record:copyrighttext,
    # 'copyright_link':lambda record:copyright_link,
    # 'link':lambda record:'https://mnemolibrary.com/discover/topic/'+str(record.get('quiz','')),
    # 'suggestions': lambda record:record.get('multiple_choices','').split("|||"), 
    # 'medialink': lambda record:resize_base64_image(record.get('image'),150,150), 
    # 'autoshow_media': lambda record:'false', 
    # 'infolink': lambda record:'https://mnemolibrary.com/discover/topic/'+str(record.get('quiz',''))+'/'+str(record.get('_id','')), 
    # 'extraclue': lambda record:record.get('mnemonic',''), 
    # 'title': lambda record:record.get('quiz',''), 
    # 'answer': lambda record:record.get('answer',''), 
    # 'difficulty':3,
    # 'width': 20,
    # 'height': 20,
    # 'country': country,
    # 'cutoff':8,
    # }
