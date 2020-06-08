import asyncio
import sys
import concurrent
import os

def os_system(command):
    os.system(command)

async def run_command():
    loop = asyncio.get_event_loop()
    #command = path + ' -w=' + file_name + ' "{}" '.format(text)
    command = "mosquitto -d" # -c /etc/mosquitto/mosquitto.conf"
    executor = concurrent.futures.ProcessPoolExecutor(
        max_workers=1,
    )
    await loop.run_in_executor(executor,os_system,command)


class MosquittoService():
    def __init__(self,hostname,port,username='',password=''):
        pass
        
    async def run(self):
       await run_command()
        
        
