import asyncio
import sys
import concurrent
import os
import logging



# =-===================================
# ASYNCIO EXAMPLE
# =-===================================
from rasa_sdk import utils
from rasa_sdk.endpoint import run, create_ssl_context, create_app
import socket

from sanic import Sanic
from sanic.response import json

# =-===================================
# END ASYNCIO EXAMPLE
# =-===================================


async def run_command():
    print("action server run")
    #await asyncio.sleep(500)
    # print("action server now")
    # app = create_app('actions')
    # # ssl_context = None #create_ssl_context(ssl_certificate, ssl_keyfile, ssl_password)
    # print("action server app")
    # server = app.create_server(host="0.0.0.0", port=5005, return_asyncio_server=True)
    # await server()
    # print('dddd')
    #task = asyncio.ensure_future(server)
    # self.loop.run_forever()
    # app.run("0.0.0.0", port, ssl=ssl_context, workers=1, loop=self.loop)
    # print("action server done")
    # server socket
    # server_socket = '/tmp/sanic.sock'
    # sock = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
    # try:
        # os.remove(server_socket)
    # finally:
        # sock.bind(server_socket)

    # srv_coro = app.create_server(
        # sock=sock,
        # return_asyncio_server=True,
        # asyncio_server_kwargs=dict(
            # start_serving=False
        # )
    # )
    # print("action server got coro")
    # srv = self.loop.run_until_complete(srv_coro)
    # print("action server got coro run until complete")
    # try:
        # assert srv.is_serving() is False
        # print("action server start serve")
        # self.loop.run_until_complete(srv.start_serving())
        # assert srv.is_serving() is True
        # self.loop.run_until_complete(srv.serve_forever())
        # print("action server start serve DONE")
        
    # except KeyboardInterrupt:
        # srv.close()
        # self.loop.close()
    
    
    
    await run(
        'actions',
        '5005'
    )


class RasaActionsServer():
    def __init__(
            self,
            config,
            loop
    ):
        self.loop = loop
        
    async def run(self):
       await run_command()
        
        
