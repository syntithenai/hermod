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
from signal import signal, SIGINT

from rasa_sdk.endpoint import create_app

class RasaActionsService():

    def __init__(self,config,loop):
        self.config = config
        self.loop = loop
        # print('INIT')
        # generate_certificates(config['services']['WebService'].get('domain_name'),config['services']['WebService'].get('email'))
                
    async def run(self):
        print('RUN')
        # print(self.config)
        app = create_app('actions')
        
        @app.listener('after_server_start')
        async def after_start_test(app, loop):
            print("Async Server Started!")
        
        server = app.create_server(host="0.0.0.0", port=5055, access_log = False, return_asyncio_server=True)
        loop = asyncio.get_event_loop()
        # print("got loop")
        print(loop)
        try:
            serv_task = asyncio.ensure_future(server)
            # print("srv task")
            # signal(SIGINT, lambda s, f: loop.stop())
            # print("set sig")
            #server = loop.run_until_complete(serv_task)
            server = await serv_task
            # print("run until complete")
            server.after_start()
            # print("after start")
            # try:
        except Exception as e:
            print(e)
            # loop.run_forever()
        # except KeyboardInterrupt as e:
            # loop.stop()
        # finally:
            # server.before_stop()

            # # Wait for server to close
            # close_task = server.close()
            # loop.run_until_complete(close_task)

            # # Complete all tasks on the loop
            # for connection in server.connections:
                # connection.close_if_idle()
            # server.after_stop()
        
        
            
        try:
            while True:
                await asyncio.sleep(1)
                # print("looping")
        except KeyboardInterrupt:
            server.close()
            # loop.close()
            
        # cert_path = self.config['services']['WebService'].get('certificates_folder')
        # # print(cert_path)
        # if os.path.isfile(cert_path+'/cert.pem')  and os.path.isfile(cert_path+'/privkey.pem'):
            # #hostname = self.config.get('hostname','localhost')
            # ssl = {'cert': cert_path+"/cert.pem", 'key': cert_path+"/privkey.pem"}
            
            # server = secureredirector.create_server(host="0.0.0.0", port=80, access_log = True, return_asyncio_server=True)
            # ssl_server = app.create_server(host="0.0.0.0", port=443, access_log = True, return_asyncio_server=True,ssl=ssl)
            # # print('RUN ssl')
            # ssl_task = asyncio.ensure_future(ssl_server)
            # # print('RUN plain')
            # task = asyncio.ensure_future(server)
            # try:
                # while True:
                    # await asyncio.sleep(1)
            # except KeyboardInterrupt:
                # server.close()
                # ssl_server.close()
                # loop.close()
        # else:
            # print("Failed to start web server - MISSING SSL CERTS")
            
     

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
    
