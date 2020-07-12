import logging
import sys
from sanic import Sanic
from sanic.exceptions import ServerError
from sanic.response import json, redirect, file, file_stream, text, html
from sanic.log import logger
import json as jsonlib
import asyncio
import socket
import os
import string
import random
from subprocess import call
import time
import motor
import motor.motor_asyncio
from bson.objectid import ObjectId
from sanic_cors import CORS, cross_origin
## DATABASE FUNCTIONS


import types  
from asyncio_mqtt import Client  

CONFIG={
    'mqtt_hostname':os.environ.get('MQTT_HOSTNAME','localhost'),
    'mqtt_user':os.environ.get('MQTT_USER',''),
    'mqtt_password':os.environ.get('MQTT_PASSWORD',''),
    'mqtt_port':int(os.environ.get('MQTT_PORT','1883')) ,
}


class AuthenticatedMqttClient(Client):
    def __init__(self,hostname,port,username='',password=''):
        super(AuthenticatedMqttClient, self).__init__(hostname,port)
        self._client.username_pw_set(username, password)    
        
    # hack to include topic in yielded    
    def _cb_and_generator(self, *, log_context, queue_maxsize=0):
        # Queue to hold the incoming messages
        messages = asyncio.Queue(maxsize=queue_maxsize)
        # Callback for the underlying API
        def _put_in_queue(client, userdata, msg):
            try:
                # convert set to object
                message = types.SimpleNamespace()
                message.topic = msg.topic
                message.payload = msg.payload
                messages.put_nowait(message)
            except asyncio.QueueFull:
                MQTT_LOGGER.warning(f'[{log_context}] Message queue is full. Discarding message.')
        # The generator that we give to the caller
        async def _message_generator():
            # Forward all messages from the queue
            while True:
                yield await messages.get()
        return _put_in_queue, _message_generator()



async def publish(topic,payload): 
    async with AuthenticatedMqttClient(CONFIG.get('mqtt_hostname','localhost'),CONFIG.get('mqtt_port',1883),CONFIG.get('mqtt_user',''),CONFIG.get('mqtt_password','')) as client:
        await client.publish(topic,jsonlib.dumps(payload))




def mongo_connect(collection):
    # logger = logging.getLogger(__name__)
    # print('MONGO CONNECT ')
    # print(str(os.environ.get('MONGO_CONNECTION_STRING')))
    
    client = motor.motor_asyncio.AsyncIOMotorClient(os.environ.get('MONGO_CONNECTION_STRING'))

    db = client['hermod']
    collection = db[collection]
    return collection
  
def get_password(stringLength=10):
    """Generate a random string of fixed length """
    letters = string.ascii_lowercase
    return ''.join(random.choice(letters) for i in range(stringLength))

# mosquitto_passwd -b passwordfile username password
async def get_mosquitto_user(email):
    randomtag = get_password(4)
    email_clean = email.replace("@",'__')
    email_clean = email_clean.replace(".",'_') + '_' + randomtag
    # print(email_clean)
    # print('get mosq user')
    password = get_password()
    cmd = ['/usr/bin/mosquitto_passwd','-b','/etc/mosquitto/password',email_clean,password] 
    p = call(cmd)
    # TODO async sleep
    await asyncio.sleep(0.5)
    return {"email":email,"email_clean":email_clean,"password":password}

# # http -> https
secureredirector = Sanic("hermodweb_secure_redirect")
# secureredirector.route('/<path:path>')
async def catch_all(request, path=''):
    return await file('/app/www/secure_redirect.html')
async def catch_all_root(request):
    return await file('/app/www/secure_redirect.html')

secureredirector.add_route(catch_all_root,'/')    
secureredirector.add_route(catch_all,'/<path:path>')    

# # main web server
app = Sanic("hermodweb")

async def ssl_catch_all(request, path=''):
    return await file('/app/www/spokencrossword/build/index.html')
    
async def ssl_catch_all_root(request):
    return await file('/app/www/spokencrossword/build/index.html')
    
async def ssl_serve_file(request,path):
    # if path == "/" or path == "":
        # return await file('/app/www/spokencrossword/build/index.html')
    # elif path ==  "/vanilla" or path ==  "/vanilla/":
        # return await file('/app/www/spokencrossword/vanilla/static/index.html')
    # else:
    parts = path.split("/")
    root_path = '/app/www/spokencrossword/build/'
    file_path= path
    if len(parts) > 0 and parts[0] == 'vanilla':
        root_path = '/app/www/spokencrossword/vanilla/static/'
        file_path = "/".join(parts[1:])
    elif len(parts) > 0 and parts[0] == 'tts':
        root_path = '/app/www/tts/'
        file_path = "/".join(parts[1:])    
    
    try:
        if file_path == '':
            file_path = 'index.html'
        return await file_stream(root_path + file_path)
    except FileNotFoundError:
        # raise ServerError("Not found", status_code=400)
        return await file_stream(root_path + 'index.html')
    except:
        raise ServerError("Server Error", status_code=500)

app.add_route(ssl_catch_all_root,'/')    
# app.add_route(ssl_catch_all,'/<path:path>') 
app.add_route(ssl_serve_file,'/<path:path>')
logging.getLogger('sanic_cors').level = logging.DEBUG

# old plain javascript version
app.static('/vanilla','/app/www/spokencrossword/vanilla/static', stream_large_files=True)
#app.static('/react','/app/www/spokencrossword/build', stream_large_files=True)
#app.static('/<path:path>','/app/www/spokencrossword/build/index.html')
# config request - connection details for mqtt
#app.static('/','/app/www/spokencrossword/build/index.html')
# config request - connection details for mqtt
async def get_hermod_config(request):
  data = await get_mosquitto_user("webuser")
  
  webconfig = {
    # "server": "wss://peppertrees.asuscomm.com:9001", 
    "username": data.get('email_clean'),
    "password": data.get('password'),
    "subscribe": "hermod/"+data.get('email_clean')+"/#",
    "hotwordsensitivity" : 0.5    ,
    "site" :data.get('email_clean')
  } 

  
  # direct from env vars because config not available (could try embed sanic and routes inside webservice?)
  webconfig['analytics_code'] = os.getenv('GOOGLE_ANALYTICS_CODE','')
  webconfig['adsense_key'] = os.getenv('ADSENSE_KEY','')
  webconfig['adsense_slot'] = os.getenv('ADSENSE_SLOT','')
  return json(webconfig)
  
app.add_route(get_hermod_config, "/config")



# CROSSWORDS
async def get_crosswords(request):
    search = request.args.get('search','')
    difficulty = request.args.get('difficulty','')
    # print('CROSSWORDS')
    # print(request)
    print([search, difficulty])
    try:
        # print('FIND FACT conn')
        collection = mongo_connect('crosswords') 

        # collection = mongo_connect('crosswords') 
        # print('FIND FACT CONNECTED')
        andParts = []
        if len(search) > 0:
            andParts.append({'title':{'$regex':search}})
        if len(difficulty) > 0:
            andParts.append({'$or':[{'difficulty':difficulty},{'difficulty':int(difficulty)}]})
        andParts.append({ 'access': { '$exists': False, '$nin': [''] } })
        
        query={}
        if len(andParts) > 0:
            query = {'$and':andParts}
        # print(query)
        crosswords = []
        cursor = collection.find(query)
        cursor.sort('title', 1).limit(2000)
        results_per_difficulty = 5
        # for empty search limit results per difficulty value to results_per_difficulty
        difficulty_tallies = {}
        async for document in cursor:
            document['_id'] = str(document.get('_id'))
            # print(document)
            difficulty_tally = int(difficulty_tallies.get(str(document.get('difficulty')),'0'))
            difficulty_tallies[str(document.get('difficulty'))] = difficulty_tally + 1
            # print(difficulty_tallies)
            if difficulty_tallies[str(document.get('difficulty'))] < results_per_difficulty or len(andParts) > 0:
                crosswords.append(document)
        #document = await collection.find_many(query)
        # print(crosswords)
        return json(crosswords)
    except:
        print('FIND FACT ERR')
        e = sys.exc_info()
        print(e)
        
        
async def get_crossword(request):
    print('CROSSWORD')
    # print(request.args)
    # print(request.args.get('id'))
    if request.args.get('id',False):
        # crosswordId = None #request.getid
        # print([crosswordId])
        try:
            # print('FIND FACT conn')
            collection = mongo_connect('crosswords') 

            # print('FIND FACT CONNECTED')
            query = {'_id':ObjectId(request.args.get('id'))}
            # print(query)
            document = await collection.find_one(query)
            # crosswords = []
            # async for document in collection.find(query):
                # print(document)
                # crosswords.append(document)
            # #document = await collection.find_many(query)
            print(document)
            document['_id'] = str(document.get('_id'))
            if request.args.get('site',False):
                print('SEND SET SLOTS')
                e = sys.exc_info()
                await publish('hermod'+request.args.get('site')+'rasa/setslots',{"slots":[{"crossword":document['_id']}]})
            return  json(document)
        except:
            print('FIND FACT ERR')
            e = sys.exc_info()
            print(e)        


app.add_route(get_crossword, "/api/crossword")
app.add_route(get_crosswords, "/api/crosswords")


class WebService():

    def __init__(self,config,loop):
        self.config = config
        self.loop = loop
        # print('INIT')
        # generate_certificates(config['services']['WebService'].get('domain_name'),config['services']['WebService'].get('email'))
                
    async def run(self):
        # print('RUN')
        # print(self.config)
        cert_path = self.config['services']['WebService'].get('certificates_folder')
        # print(cert_path)
        if os.path.isfile(cert_path+'/cert.pem')  and os.path.isfile(cert_path+'/privkey.pem'):
            #hostname = self.config.get('hostname','localhost')
            ssl = {'cert': cert_path+"/cert.pem", 'key': cert_path+"/privkey.pem"}
            server = secureredirector.create_server(host="0.0.0.0", port=80, access_log = True, return_asyncio_server=True)
            # cors = CORS(app) #, resources={r"/api/*": {"origins": "*"}})

            ssl_server = app.create_server(host="0.0.0.0", port=443, access_log = True, return_asyncio_server=True,ssl=ssl)
            # print('RUN ssl')
            ssl_task = asyncio.ensure_future(ssl_server)
            # print('RUN plain')
            task = asyncio.ensure_future(server)
            try:
                while True:
                    await asyncio.sleep(1)
            except KeyboardInterrupt:
                server.close()
                ssl_server.close()
                loop.close()
        else:
            print("Failed to start web server - MISSING SSL CERTS")
            
     

# def logme(msg):
    # logger.info(msg)

# def start_server(config , run_event):
    
    # if os.environ.get('SSL_CERTIFICATES_FOLDER'):
        # if os.path.isfile(os.path.join(os.environ.get('SSL_CERTIFICATES_FOLDER'),'cert.pem')) and os.path.isfile(os.path.join(os.environ.get('SSL_CERTIFICATES_FOLDER'),'privkey.pem')):
            # print('START SSL WEB SERVER')
            # app.run(host='0.0.0.0',ssl_context=(os.path.join(os.environ.get('SSL_CERTIFICATES_FOLDER'),'cert.pem'), os.path.join(os.environ.get('SSL_CERTIFICATES_FOLDER'),'privkey.pem')), port=443, extra_files=[os.path.join(os.path.dirname(__file__),"index.html")])
        # else:
            # print('START WEB SERVER')
            # app.run(host='0.0.0.0', port=80, extra_files=[os.path.join(os.path.dirname(__file__),"index.html")])
    
    # else:
        # print('START WEB SERVER')
        # app.run(host='0.0.0.0', port=80, extra_files=[os.path.join(os.path.dirname(__file__),"index.html")])
    
