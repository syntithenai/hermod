import asyncio
import logging
import motor
import motor.motor_asyncio
import sys
import time
import os

def mongo_connect():
    logger = logging.getLogger(__name__)
    print('MONGO CONNECT ')
    client = motor.motor_asyncio.AsyncIOMotorClient(os.environ.get('MNEMO_CONNECTION_STRING'))
    
    db = client['mnemo']
    collection = db['questions']
    return collection
    
def mongo_connect_mnemonics():
    logger = logging.getLogger(__name__)
    print('MONGO CONNECT ')
    client = motor.motor_asyncio.AsyncIOMotorClient(os.environ.get('MNEMO_CONNECTION_STRING'))
    
    db = client['mnemo']
    collection = db['mnemonics']
    return collection
        
def mongo_connect_local():
    logger = logging.getLogger(__name__)
    print('MONGO CONNECT ')
    
    client = motor.motor_asyncio.AsyncIOMotorClient(os.environ.get('MONGO_CONNECTION_STRING'))

    db = client['hermod']
    collection = db['wikifacts']
    return collection


async def find_mnemonic(question_id):
    logger = logging.getLogger(__name__)
    print('FIND mn')
    try:
        collection = mongo_connect_mnemonics() 
        print('FIND mn CONNECTED')
        query = {'question':question_id}
        #{'$and':[{'quiz':{'$regex':'Capital Cities'}},{'thing':thing}]}
        document = await collection.find_one(query)
        return document
        # async for document in collection.find(query).limit(5): #.limit(5):
            # print(document)
    except:
        print('FIND mn ERR')
        e = sys.exc_info()
        print(e)

async def find_pages():
    logger = logging.getLogger(__name__)
    print('FIND FACT')
    try:
        print('FIND FACT conn')
        
        collection = mongo_connect() 
        print('FIND FACT CONNECTED')
        query = {'quiz':{'$regex':'Capital Cities'}}
        #{'$and':[{'quiz':{'$regex':'Capital Cities'}},{'thing':thing}]}
        
        async for document in collection.find(query): #.limit(5):
            print(document)
            
            mnemonic = document.get('mnemonic',None)
            if document.get('hasMnemonic') and not mnemonic:
                mnemonic_record = await find_mnemonic(str(document.get('_id')))
                mnemonic = mnemonic_record.get('mnemonic',None)
            await save_fact('capital',document.get('question','').lower(),document.get('specific_answer'),'importer','place',document.get('mnemonic'))
           
    except:
        print('FIND FACT ERR')
        e = sys.exc_info()
        print(e)
        
        
        

async def save_fact(attribute,thing,answer,site,thing_type,mnemonic):
   
    print('SAVE FACT')
    print([attribute,thing,answer])
    try:
        if attribute and thing and answer: 
            collection = mongo_connect_local() 
            # does fact already exist and need update ?
            query = {'$and':[{'attribute':attribute},{'thing':thing}]}
            print(query)
            document = await collection.find_one(query)
            if document:
                print('FOUND DOCUMENT MATCH')
                document['answer'] = answer
                document['mnemonic'] = mnemonic
                site_parts = site.split('_')
                username = '_'.join(site_parts[:-1])
                document['user'] = username
                document['updated'] = time.time()
                result = await collection.replace_one({"_id":document.get('_id')},document)
                print(result)
            else:
                print('SAVE FACT not found')
                site_parts = site.split('_')
                username = '_'.join(site_parts[:-1])
                document = {'attribute': attribute,'thing':thing,'answer':answer,"user":username,"thing_type":thing_type}
                document['mnemonic'] = mnemonic
                document['created'] = time.time()
                document['updated'] = time.time()
                result = await collection.insert_one(document)
                print('result %s' % repr(result.inserted_id))
    except:
        print('SAVE FACT ERR')
        e = sys.exc_info()
        print(e)

asyncio.run(find_pages())
        


# async def save_fact(attribute,thing,answer,site,thing_type):
    # logger = logging.getLogger(__name__)
    # print('SAVE FACT')
    # print([attribute,thing,answer])
    # try:
        # if attribute and thing and answer: 
            # collection = mongo_connect() 
            # # does fact already exist and need update ?
            # query = {'$and':[{'attribute':attribute},{'thing':thing}]}
            # print(query)
            # document = await collection.find_one(query)
            # print(document)
            # if document:
                # print('FOUND DOCUMENT MATCH')
                # document['answer'] = answer
                # site_parts = site.split('_')
                # username = '_'.join(site_parts[:-1])
                # document['user'] = username
                # document['updated'] = time.time()
                # result = await collection.replace_one({"_id":document.get('_id')},document)
                # print(result)
            # else:
                # print('SAVE FACT not found')
                # site_parts = site.split('_')
                # username = '_'.join(site_parts[:-1])
                # document = {'attribute': attribute,'thing':thing,'answer':answer,"user":username,"thing_type":thing_type}
                # document['created'] = time.time()
                # document['updated'] = time.time()
                # result = await collection.insert_one(document)
                # print('result %s' % repr(result.inserted_id))
    # except:
        # print('SAVE FACT ERR')
        # e = sys.exc_info()
        # print(e)

