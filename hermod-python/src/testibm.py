import asyncio
import base64
import websockets
import json
import requests
import pyaudio
import time
import os
from dotenv import load_dotenv
load_dotenv()
    
# Variables to use for recording audio
CHUNK = 1024
FORMAT = pyaudio.paInt16
CHANNELS = 2
RATE = 16000

p = pyaudio.PyAudio()

# This is the language model to use to transcribe the audio
#model = "en-US_BroadbandModel"

# These are the urls we will be using to communicate with Watson
#default_url = "https://stream.watsonplatform.net/speech-to-text/api"
# token_url = "https://stream.watsonplatform.net/authorization/api/v1/token?" \
#           "url=https://stream.watsonplatform.net/speech-to-text/api"

#url = "wss://stream.watsonplatform.net/speech-to-text/api/v1/recognize?model=en-US_BroadbandModel"

# # BlueMix app credentials
# username = ""   # Your Bluemix App username
# password = ""   # Your Bluemix App password

# # Send a request to get an authorization key
# r = requests.get(token_url, auth=(username, password))
# auth_token = r.text
# token_header = {"X-Watson-Authorization-Token": auth_token}

# token_header = {}

# userpass = ":".join(("apikey", 'GHkKme3p1bLk6f-pflW0FXmWyRustT-A6vKaCyeErWGO'))

# token_header["Authorization"] = "Basic " + base64.b64encode(userpass.encode()).decode()



def get_url():
    # if region is set, use lookups
    # https://console.bluemix.net/docs/services/speech-to-text/websockets.html#websockets
    if os.environ.get('IBM_SPEECH_TO_TEXT_REGION',False):
        host = REGION_MAP[os.environ.get('IBM_SPEECH_TO_TEXT_REGION')]
        return ("wss://{}/speech-to-text/api/v1/recognize"
           "?model=en-US_BroadbandModel").format(host)
    # if url from downloaded creds
    elif os.environ.get('IBM_SPEECH_TO_TEXT_URL',False):
       return os.environ.get('IBM_SPEECH_TO_TEXT_URL')
    # fallback to us-east
    else:
        return ("wss://{}/speech-to-text/api/v1/recognize"
           "?model=en-US_BroadbandModel").format('us-east')
    
def get_auth():
    print('AUTH')
    print(os.environ.get('IBM_SPEECH_TO_TEXT_APIKEY'))
    apikey = str(os.environ.get('IBM_SPEECH_TO_TEXT_APIKEY'))
    return ("apikey", apikey)
    
def get_headers():
    headers = {}
    userpass = ":".join(get_auth())
    headers["Authorization"] = "Basic " + base64.b64encode(
        userpass.encode()).decode()
    return headers

def get_init_params():
    # Params to use for Watson API
    return {
        "word_confidence": True,
        "content_type": "audio/l16;rate=16000;channels=2",
        "action": "start",
        "interim_results": True
    }
    

# Opens the stream to start recording from the default microphone
stream = p.open(format=FORMAT,
                channels=CHANNELS,
                rate=RATE,
                input=True,
                output=True,
                frames_per_buffer=CHUNK)


async def send_audio(ws):
    # Starts recording of microphone
    print("* READY *")

    start = time.time()
    while True:
        try:
            print(".")
            data = stream.read(CHUNK)
            await ws.send(data)
            if time.time() - start > 20:    # Records for n seconds
                await ws.send(json.dumps({'action': 'stop'}))
                return False
        except Exception as e:
            print(e)
            return False

    # Stop the stream and terminate the recording
    stream.stop_stream()
    stream.close()
    p.terminate()


async def speech_to_text():
    async with websockets.connect(get_url(), extra_headers=get_headers()) as conn:
        # Send request to watson and waits for the listening response
        send = await conn.send(json.dumps(get_init_params()))
        rec = await conn.recv()
        print(rec)
        asyncio.ensure_future(send_audio(conn))

        # Keeps receiving transcript until we have the final transcript
        while True:
            try:
                rec = await conn.recv()
                parsed = json.loads(rec)
                transcript = parsed["results"][0]["alternatives"][0]["transcript"]
                print(transcript)
                #print(parsed)
                if "results" in parsed:
                    if len(parsed["results"]) > 0:
                        if "final" in parsed["results"][0]:
                            if parsed["results"][0]["final"]:
                                #conn.close()
                                #return False
                                pass
            except KeyError:
                conn.close()
                return False

# Starts the application loop
loop = asyncio.get_event_loop()
loop.run_until_complete(speech_to_text())
loop.close()

