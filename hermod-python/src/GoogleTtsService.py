"""
This class listens for tts/say messages and triggers a sequence of messages
that result in the text message being converted to wav audio and played through the speaker service
TODO Where the text is very long, it is split into parts and sent sequentially.
The speaker service sends start and end messages.
This service iterates each part, waiting for each speaker/started and speaker/finished message
and finally sends a tts/finished  message when all parts have finished playing
Depends on os pico2wav install with path in config.yaml
"""

import json
import os
import aiofiles
import concurrent.futures
import asyncio
from random import seed
from random import randint
from MqttService import MqttService
import unicodedata
import string

from google.cloud import texttospeech

from pathlib import Path

valid_filename_chars = "-_() %s%s" % (string.ascii_letters, string.digits)
char_limit = 240



# seed random number generator
seed(1)

def write_speech(text,file_name,config):
    print('WRITE SPEECH')
    print([text,file_name,config])
    # Instantiates a client
    client = texttospeech.TextToSpeechClient()

    # Set the text input to be synthesized
    synthesis_input = texttospeech.SynthesisInput(text=text)

    # Build the voice request, select the language code ("en-US") and the ssml
    # voice gender ("neutral")
    voice = texttospeech.VoiceSelectionParams(
        language_code=config.get('language','en-US'),
        ssml_gender=texttospeech.SsmlVoiceGender.NEUTRAL)

    # Select the type of audio file you want returned
    audio_config = texttospeech.AudioConfig(
        audio_encoding=texttospeech.AudioEncoding.MP3)

    # Perform the text-to-speech request on the text input with the selected
    # voice parameters and audio file type
    response = client.synthesize_speech(
        request={"input": input_text, "voice": voice, "audio_config": audio_config}
    )
    print('GOT GOO SPEECH REQ')
    
    return response.audio_content


def clean_filename(filename, whitelist=valid_filename_chars, replace=' '):
    # replace spaces
    for r in replace:
        filename = filename.replace(r,'_')
    
    # keep only valid ascii chars
    cleaned_filename = unicodedata.normalize('NFKD', filename).encode('ASCII', 'ignore').decode()
    
    # keep only whitelisted chars
    cleaned_filename = ''.join(c for c in cleaned_filename if c in whitelist)
    # if len(cleaned_filename)>char_limit:
        # print("Warning, filename truncated because it was over {}. Filenames may no longer be unique".format(char_limit))
    return cleaned_filename[:char_limit]    
 

def my_run_in_executor(executor, f, *args):
    return asyncio.wrap_future(executor.submit(f, *args))

class GoogleTtsService(MqttService):
    """ Text to Speech Service Class """

    def __init__(
            self,
            config,
            loop
    ):
        super(
            GoogleTtsService,
            self).__init__(config,loop)
        self.config = config
        # subscribe to all sites
        self.subscribe_to = 'hermod/+/tts/say'
        cache_path = self.config['services']['GoogleTtsService'].get('cache_path','/tmp/tts_cache')
        Path(cache_path).mkdir(parents=True, exist_ok=True)


    async def on_message(self, msg):
        self.log('message {}'.format(msg))
        topic = "{}".format(msg.topic)
        parts = topic.split('/')
        site = parts[1]
        payload = {}
        try:
            payload = json.loads(msg.payload)
        except BaseException:
            pass
        # self.log('TTS payload')
        # self.log(payload)
        text = payload.get('text','')
        #self.log(text)
        if topic == 'hermod/' + site + '/tts/say' and len(text) > 0:
            # self.log('TTS start gen')
        
            await self.generate_audio(site, text, payload)
        elif topic == 'hermod/' + site + '/speaker/finished':
            # self.log('SPEAKER FINISHED')
                # self.log(payload)
            #self.play_requests[payload.get('id')] = value;
            
            message = {"id": payload.get('id')}
            await asyncio.sleep(0.5)
            await self.client.publish(
                'hermod/{}/tts/finished'.format(site),
                json.dumps(message))
            await self.client.unsubscribe('hermod/{}/speaker/finished'.format(site))

    
    """ Use system binary pico2wav to generate audio file from text then send audio as mqtt"""
    async def generate_audio(self, site, text, payload):
        cache_path = self.config['services']['GoogleTtsService'].get('cache_path','/tmp/tts_cache')
        value = payload.get('id','no_id')
        # self.log('TTS GEN '+cache_path)
        
        if len(text) > 0:
            # self.log('TTS havetext')
        
            # filename limits
            short_text = text[0:200].replace(' ','_')
            # speakable and limited
            say_text = text[0:300].replace('(','').replace(')','')
            file_name = os.path.join(cache_path, clean_filename('tts-' + str(short_text)) + '.wav')
            # self.log('TTS file '+file_name)
        
            # generate if file doesn't exist in cache
            audio_file = None
            if not os.path.isfile(file_name):
                self.log('TTS exec')
                with concurrent.futures.ProcessPoolExecutor() as executor:
                #audio_file = await self.loop.run_in_executor(None,write_speech,text, file_name, self.config)
                    audio_file = await my_run_in_executor(executor,write_speech,say_text , file_name, self.config)
                async with aiofiles.open(file_name, mode='wb') as f:
                    await f.write(audio_file)
                # The response's audio_content is binary.
                # with open(file_name, 'wb') as out:
                    # out.write(response.audio_content)
                self.log('TTS DONE write')
            else:     
                self.log('TTS read')
        
                async with aiofiles.open(file_name, mode='rb') as f:
                    audio_file = await f.read()
            self.log('TTS now send {}'.format(len(audio_file)))
            
            await self.client.subscribe('hermod/{}/speaker/finished'.format(site))
            
            slice_length = 16000
            def chunker(seq, size):
                return (seq[pos:pos + size] for pos in range(0, len(seq), size))

            lc = 0
            ts = 0
            for slice in chunker(audio_file, slice_length):
                lc = lc + 1
                ts = ts + len(slice)
                await self.client.publish('hermod/{}/speaker/cache/{}'.format(site, value), payload=bytes(slice), qos=0)
            
            self.log(lc)
            self.log(ts)
            # finally send play message with empty payload
            await self.client.publish(
                'hermod/{}/speaker/play/{}'.format(site, value), payload=None, qos=0)
                
            self.log('TTS sent ')
            # cache short texts
            if len(short_text) > self.config.get('cache_max_letters',100):
                # self.log('TTS remove file')
                os.remove(file_name)
