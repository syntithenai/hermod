from sanic import Sanic
from sanic.exceptions import ServerError
from sanic.response import json, redirect, file, file_stream
from sanic.log import logger
import asyncio
import socket
import os
import string
import random
from subprocess import call
import time

print('START')

def get_password(stringLength=10):
    """Generate a random string of fixed length """
    letters = string.ascii_lowercase
    return ''.join(random.choice(letters) for i in range(stringLength))

# mosquitto_passwd -b passwordfile username password
def get_mosquitto_user(email):
    randomtag = get_password(4)
    email_clean = email.replace("@",'__')
    email_clean = email_clean.replace(".",'_') + '_' + randomtag
    print(email_clean)
    print('get mosq user')
    password = get_password()
    cmd = ['/usr/bin/mosquitto_passwd','-b','/etc/mosquitto/password',email_clean,password] 
    p = call(cmd)
    # TODO async sleep
    time.sleep(0.5)
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
        raise ServerError("Not found", status_code=400)
    except:
        raise ServerError("Server Error", status_code=500)

app.add_route(ssl_catch_all_root,'/')    
# app.add_route(ssl_catch_all,'/<path:path>') 
app.add_route(ssl_serve_file,'/<path:path>')

# old plain javascript version
app.static('/vanilla','/app/www/spokencrossword/vanilla/static', stream_large_files=True)
#app.static('/react','/app/www/spokencrossword/build', stream_large_files=True)
#app.static('/<path:path>','/app/www/spokencrossword/build/index.html')
# config request - connection details for mqtt
#app.static('/','/app/www/spokencrossword/build/index.html')
# config request - connection details for mqtt
async def get_hermod_config(request):
  webconfig = get_mosquitto_user("webuser")
  # direct from env vars because config not available (could try embed sanic and routes inside webservice?)
  webconfig['analytics_code'] = os.getenv('GOOGLE_ANALYTICS_CODE','')
  webconfig['adsense_key'] = os.getenv('ADSENSE_KEY','')
  webconfig['adsense_slot'] = os.getenv('ADSENSE_SLOT','')
  return json(webconfig)
  
app.add_route(get_hermod_config, "/config")

class WebService():

    def __init__(self,config,loop):
        self.config = config
        self.loop = loop
        print('INIT')
        # generate_certificates(config['services']['WebService'].get('domain_name'),config['services']['WebService'].get('email'))
        
        
        
        
    async def run(self):
        print('RUN')
        print(self.config)
        cert_path = self.config['services']['WebService'].get('certificates_folder')
        print(cert_path)
        if os.path.isfile(cert_path+'/cert.pem')  and os.path.isfile(cert_path+'/privkey.pem'):
            #hostname = self.config.get('hostname','localhost')
            ssl = {'cert': cert_path+"/cert.pem", 'key': cert_path+"/privkey.pem"}
            server = secureredirector.create_server(host="0.0.0.0", port=80, access_log = True, return_asyncio_server=True)
            ssl_server = app.create_server(host="0.0.0.0", port=443, access_log = True, return_asyncio_server=True,ssl=ssl)
            print('RUN ssl')
            ssl_task = asyncio.ensure_future(ssl_server)
            print('RUN plain')
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
    
