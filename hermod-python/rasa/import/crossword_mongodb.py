import puz
from bs4 import BeautifulSoup
    
import uuid
import requests
from bson.objectid import ObjectId
import types  
import json
import motor
import motor.motor_asyncio
import os
import time
import sys
import asyncio
from metaphone import doublemetaphone
from string import ascii_lowercase
# DESTINATION FORMAT (FOR REACT-CROSSWORD)
# {
        # "across" : {
            # "1" : {
                # "clue" : "capital of australia",
                # "answer" : "canberra",
                # "row" : 0,
                # "col" : 0
            # },


  
        
def mongo_connect(collection):
    # logger = logging.getLogger(__name__)
    # logger.debug('MONGO CONNECT ')
    # logger.debug(str(os.environ.get('MONGO_CONNECTION_STRING')))
    
    client = motor.motor_asyncio.AsyncIOMotorClient(os.environ.get('MONGO_CONNECTION_STRING'))

    db = client['hermod']
    collection = db[collection]
    return collection

        
def mongo_connect_mnemo(collection):
    # logger = logging.getLogger(__name__)
    # print('MONGO CONNECT ')
    # print(str(os.environ.get('MNEMO_CONNECTION_STRING')))
    
    client = motor.motor_asyncio.AsyncIOMotorClient(os.environ.get('MNEMO_CONNECTION_STRING'))

    db = client['mnemo']
    collection = db[collection]
    return collection

async def scrape_mnemo(table,filterQuery,config):
    try:
        # print('scrape mnemo ')
        # print(table)
        # print(filterQuery)
        # print(config)
        collection = mongo_connect_mnemo(table) 
        # print('scrape mnemo CONNECTED')
        crosswords = []
        async for document in collection.find(filterQuery):
            # print(document)
            crosswords.append({
            'word' : config.get('word')(document),
            'clue' : config.get('clue')(document),
            'author' : config.get('author')(document),
            'copyright' : config.get('copyright')(document),
            'copyright_link' : config.get('copyright_link')(document),
            'link' : config.get('link')(document),
            'suggestions' : config.get('suggestions')(document),
            'title' : config.get('title')(document),
            'medialink': config.get('medialink')(document), 
            'infolink': config.get('infolink')(document), 
            'extraclue': config.get('extraclue')(document),
            'autoshow_media': config.get('autoshow_media')(document)
            })
            # print(new_crossword)
            # crosswords.append([word,clue])
        #document = await collection.find_many(query)
        # print(document)
        # document['_id'] = str(document.get('_id'))
        return crosswords
    except:
        print('scrape mnemo ERR')
        e = sys.exc_info()
        print(e) 
    
       # 'author':lambda record:author,
    # 'copyright':lambda record:copyrighttext,
    # 'copyright_link':lambda record:copyright_link,
    # 'difficulty':10,
    # 'country':lambda record:country,
    # 'link':lambda record:link,
    # 'queryFilter':{'topic':{'$regex':'English Vocab (junior high school)'}},
    # 'word': lambda record:last_word(record.get('question')), 
    # 'clue': lambda record:record.get('answer'), 
    # 'suggestions': lambda record:[], 
    # #'title': lambda record:record:record.get('topic'), 
    # 'title': lambda record:'English Vocab (Junior High School) '+ record.get('count'), 
    # 'width': 15,
    # 'height': 15 
      
async def get_crossword(uid):
    print('CROSSWORD')
    print(uid)
    if uid:
        # crosswordId = None #request.getid
        # print([crosswordId])
        try:
            # print('FIND FACT conn')
            
            collection = mongo_connect('crosswords') 
            print('FIND FACT CONNECTED')
            query = {'_id':ObjectId(uid)}
            # print(query)
            document = await collection.find_one(query)
            # crosswords = []
            # async for document in collection.find(query):
                # print(document)
                # crosswords.append(document)
            # #document = await collection.find_many(query)
            # print(document)
            document['_id'] = str(document.get('_id'))
            return document
        except:
            print('FIND FACT ERR')
            e = sys.exc_info()
            print(e)  
            
            

async def save_crossword(crossword):
    
    try:
        if crossword: 
            collection = mongo_connect('crosswords') 
            # does fact already exist and need update ?
            # query = {'$and':[{'attribute':attribute},{'thing':thing}]}
            # # logger.debug(query)
            # document = await collection.find_one(query)
            # # logger.debug(document)
            # if document:
                # # logger.debug('FOUND DOCUMENT MATCH')
                # document['answer'] = answer
                # site_parts = site.split('_')
                # username = '_'.join(site_parts[:-1])
                # document['user'] = username
                # document['updated'] = time.time()
                # result = await collection.replace_one({"_id":document.get('_id')},document)
                # #logger.debug(result)
            # else:
                # logger.debug('SAVE FACT not found')
            
            crossword['created'] = time.time()
            crossword['updated'] = time.time()
            result = await collection.insert_one(crossword)
                # logger.debug('result %s' % repr(result.inserted_id))
    except:
        print('SAVE CROSSWORD ERR')
        e = sys.exc_info()
        print(e)
