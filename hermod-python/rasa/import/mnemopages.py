import asyncio
import logging
import motor
import motor.motor_asyncio
import sys
import time

def mongo_connect():
    logger = logging.getLogger(__name__)
    print('MONGO CONNECT ')
    
    client = motor.motor_asyncio.AsyncIOMotorClient(os.environ.get('MNEMO_CONNECTION_STRING'))
    
    db = client['mnemo']
    collection = db['questions']
    return collection  
    
    


async def find_pages():
    logger = logging.getLogger(__name__)
    # print('FIND FACT')
    try:
        # print('FIND FACT conn')
        
        collection = mongo_connect() 
        # print('FIND FACT CONNECTED')
        query = {'$or':[  {'quiz':{'$regex':'Human Organs'}}, {'quiz':{'$regex':'Ingenious Inventions'}}, {'quiz':{'$regex':'Mysterious Mythology'}}, {'quiz':{'$regex':'World History'}}, {'quiz':{'$regex':'Scintillating Science'}}]}
        #{'$and':[{'quiz':{'$regex':'Capital Cities'}},{'thing':thing}]}
        
        async for document in collection.find(query): #.limit(5):
            print(document.get('question'))
           
    except:
        print('FIND FACT ERR')
        e = sys.exc_info()
        print(e)
        
        
        

# async def save_fact(attribute,thing,answer,site,thing_type,mnemonic):
   
    # print('SAVE FACT')
    # print([attribute,thing,answer])
    # try:
        # if attribute and thing and answer: 
            # collection = mongo_connect_local() 
            # # does fact already exist and need update ?
            # query = {'$and':[{'attribute':attribute},{'thing':thing}]}
            # print(query)
            # document = await collection.find_one(query)
            # if document:
                # print('FOUND DOCUMENT MATCH')
                # document['answer'] = answer
                # document['mnemonic'] = mnemonic
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
                # document['mnemonic'] = mnemonic
                # document['created'] = time.time()
                # document['updated'] = time.time()
                # result = await collection.insert_one(document)
                # print('result %s' % repr(result.inserted_id))
    # except:
        # print('SAVE FACT ERR')
        # e = sys.exc_info()
        # print(e)

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

