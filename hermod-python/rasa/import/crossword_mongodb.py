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
