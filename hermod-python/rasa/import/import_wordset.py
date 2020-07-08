#!/usr/local/bin/python

# first download from git
# git clone https://github.com/wordset/wordset-dictionary.git

import json
import motor
import motor.motor_asyncio
import os
import time
import sys
import asyncio
from metaphone import doublemetaphone
from string import ascii_lowercase
    

async def run():
    #pass
    # only import if database is empty
    already_imported = await is_already_imported()
    if not already_imported:
        collection = mongo_connect() 
        await  import_files(collection)


async def import_files(collection):
    limit = 5000000000000
    wordset_path = '/app/wordset-dictionary/data/'
    for c in ascii_lowercase:
        print(c)
        if limit <=0:
            break
        f = open("{}{}.json".format(wordset_path,c), "r")
        words = json.loads(f.read())
        for word in words:
            if limit <=0:
                break
            # print(word)
            # print('=================================')
            # print(words.get(word))
            await save_word(collection,word,words.get(word))
            limit = limit - 1



## DATABASE FUNCTIONS


def mongo_connect():
    print('MONGO CONNECT ')
    print(str(os.environ.get('MONGO_CONNECTION_STRING')))
    
    client = motor.motor_asyncio.AsyncIOMotorClient(os.environ.get('MONGO_CONNECTION_STRING'))

    db = client['hermod']
    collection = db['wordset_dictionary']
    return collection



async def is_already_imported():
    try:
        collection = mongo_connect() 
        document = await collection.find_one({})
        if document:
            return True
        else:
            return False
    except:
        print('FIND FACT ERR')
        e = sys.exc_info()
        print(e)
    

async def save_word(collection,word,data):
    
    # print('SAVE')
    # print([data])
    try:
        metaname = doublemetaphone(word)
        queryname = metaname[0]+metaname[1]

        clean_meanings = []
        for meaning in data.get('meanings',[]):
            if meaning.get('def',False):
                clean_meanings.append({'def':meaning.get('def'),'speech_part':meaning.get('speech_part',None),'synonyms':meaning.get('synonyms',None)})
        document = {'word': word,'meanings':clean_meanings,'_s_word':queryname}
        await collection.insert_one(document)
    except:
        print('SAVE ERR')
        e = sys.exc_info()
        print(e)


# async def find_fact(attribute,thing):
    
    # print('FIND FACT')
    # print([attribute,thing])
    # try:
        # print('FIND FACT conn')
        
        # collection = mongo_connect() 
        # print('FIND FACT CONNECTED')
        # query = {'$and':[{'attribute':attribute},{'thing':thing}]}
        # print(query)
        # document = await collection.find_one(query)
        # print(document)
        # if document:
            # return document
        # else:
            # return None
    # except:
        # print('FIND FACT ERR')
        # e = sys.exc_info()
        # print(e)
    
    
asyncio.run(run())  

