import puz
from bs4 import BeautifulSoup

import json,random, re, time, string
from copy import copy as duplicate
     
import uuid
import requests
from bson.objectid import ObjectId
import types  
import motor
import motor.motor_asyncio
import os
import sys
import asyncio
from metaphone import doublemetaphone
from string import ascii_lowercase
from crossword_generator import Crossword, Word
from crossword_mongodb import save_crossword
  
 
# DESTINATION FORMAT (FOR REACT-CROSSWORD)
# {
        # "across" : {
            # "1" : {
                # "clue" : "capital of australia",
                # "answer" : "canberra",
                # "row" : 0,
                # "col" : 0
            # },

word_list = ['saffron', 'The dried, orange yellow plant used to as dye and as a cooking spice.'], \
    ['pumpernickel', 'Dark, sour bread made from coarse ground rye.'], \
    ['leaven', 'An agent, such as yeast, that cause batter or dough to rise..'], \
    ['coda', 'Musical conclusion of a movement or composition.'], \
    ['paladin', 'A heroic champion or paragon of chivalry.'], \
    ['syncopation', 'Shifting the emphasis of a beat to the normally weak beat.'], \
    ['albatross', 'A large bird of the ocean having a hooked beek and long, narrow wings.'], \
    ['harp', 'Musical instrument with 46 or more open strings played by plucking.'], \
    ['piston', 'A solid cylinder or disk that fits snugly in a larger cylinder and moves under pressure as in an engine.'], \
    ['caramel', 'A smooth chery candy made from suger, butter, cream or milk with flavoring.'], \
    ['coral', 'A rock-like deposit of organism skeletons that make up reefs.'], \
    ['dawn', 'The time of each morning at which daylight begins.'], \
    ['pitch', 'A resin derived from the sap of various pine trees.'], \
    ['fjord', 'A long, narrow, deep inlet of the sea between steep slopes.'], \
    ['lip', 'Either of two fleshy folds surrounding the mouth.'], \
    ['lime', 'The egg-shaped citrus fruit having a green coloring and acidic juice.'], \
    ['mist', 'A mass of fine water droplets in the air near or in contact with the ground.'], \
    ['plague', 'A widespread affliction or calamity.'], \
    ['yarn', 'A strand of twisted threads or a long elaborate narrative.'], \
    ['kitten', 'A strand of twisted threads or a long elaborate narrative.'], \
    ['horse', 'A strand of twisted threads or a long elaborate narrative.'], \
    ['dog', 'A strand of twisted threads or a long elaborate narrative.'], \
    ['cat', 'A strand of twisted threads or a long elaborate narrative.'], \
    ['chicken', 'A strand of twisted threads or a long elaborate narrative.'], \
    ['snicker', 'A snide, slightly stifled laugh.']
    
async def run(): 
    generated = generate_crossword(word_list)
    print(generated)
    final = {
      "import_id":uuid.uuid4().hex,
      "title":"Test",
      "author":"Generated",
      "copyright":"Public Domain",
      "copyright_link":"http://edison.syntithenai.com",
      "data":generated,
      "difficulty":1,
      "country":"AU",
      "link":"http://edison.syntithenai.com"
    }
    await save_crossword(final)
    
def generate_crossword(word_list):    
    a = Crossword(13, 13, '-', 5000, word_list)
    a.compute_crossword(2)
    a.word_bank()
    a.solution()
    a.word_find()
    a.display()
    print("========================================")
    # print (a.json())
    return a.json()

    
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
