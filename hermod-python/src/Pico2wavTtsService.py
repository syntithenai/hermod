""" Pico2wav based Text to Speech Service """

import json
import os
import concurrent.futures
import asyncio
import unicodedata
import string
from pathlib import Path
import aiofiles
from MqttService import MqttService

VALID_FILENAME_CHARS = "-_.() %s%s" % (string.ascii_letters, string.digits)
CHAR_LIMIT = 240

def os_system(command):
    """ run an os command """
    os.system(command)


def clean_filename(filename, whitelist=VALID_FILENAME_CHARS, replace=' '):
    """ clean a string suitable for a filename """
    # replace spaces
    for letter in replace:
        filename = filename.replace(letter, '_')

    # keep only valid ascii chars
    cln_filename = unicodedata.normalize('NFKD', filename).encode('ASCII', 'ignore').decode()

    # keep only whitelisted chars
    cln_filename = ''.join(character for character in cln_filename if character in whitelist)
    # if len(cleaned_filename)>CHAR_LIMIT:
    # print("Warning, filename truncated because it was over {}. Filenames
    # may no longer be unique".format(CHAR_LIMIT))
    return cln_filename[:CHAR_LIMIT]


class Pico2wavTtsService(MqttService):
    """
    This class listens for tts/say messages and triggers a sequence of messages
    that result in the text message being converted to wav audio and played through the speaker
    service
    The speaker service sends start and end messages.
    This service iterates each part, waiting for each speaker/started and speaker/finished message
    and finally sends a tts/finished  message when all parts have finished playing
    Depends on os pico2wav install with path in config.yaml
    """
    def __init__(
            self,
            config,
            loop
    ):
        """constructor"""
        super(
            Pico2wavTtsService,
            self).__init__(config, loop)
        self.config = config
        self.clients = {}
        # subscribe to all sites
        self.subscribe_to = 'hermod/+/tts/say,hermod/+/dialog/init'
        cache_path = self.config['services']['Pico2wavTtsService'].get(
            'cache_path', '/tmp/tts_cache')
        Path(cache_path).mkdir(parents=True, exist_ok=True)

    async def on_message(self, message):
        """handle mqtt message"""
        topic = "{}".format(message.topic)
        parts = topic.split('/')
        site = parts[1]
        payload = {}
        try:
            payload = json.loads(message.payload)
        except json.JSONDecodeError:
            pass
        text = payload.get('text')
        if topic == 'hermod/' + site + '/tts/say':
            await self.generate_audio(site, text, payload)
        elif topic == 'hermod/' + site + '/speaker/finished':
            message = {"id": payload.get('id')}
            await asyncio.sleep(0.5)
            await self.client.publish(
                'hermod/{}/tts/finished'.format(site),
                json.dumps(message))
            await self.client.unsubscribe('hermod/{}/speaker/finished'.format(site))
        elif topic == 'hermod/' + site + '/dialog/init':
            self.clients[site] = payload

    async def cleanup_file(self, short_text, file_name):
        """ delete generated file after a short delay to allow download """
        await asyncio.sleep(1)
        # cache short texts
        if len(short_text) > self.config.get('cache_max_letters', 100):
            os.remove(file_name)

    async def generate_audio(self, site, text, payload):
        """ Use system binary pico2wav to generate audio file from text then send audio as mqtt"""
        cache_path = self.config['services']['Pico2wavTtsService'].get(
            'cache_path', '/tmp/tts_cache')
        value = payload.get('id', 'no_id')

        if text:
            short_text = text[0:100].replace(' ', '_').replace(".", "")
            # speakable and limited
            say_text = text[0:300].replace('(', '').replace(')', '')
            short_file_name = clean_filename('tts-' + str(short_text)) + '.wav'
            file_name = os.path.join(cache_path, short_file_name)

            # generate if file doesn't exist in cache
            if not os.path.isfile(file_name):
                path = self.config['services']['Pico2wavTtsService']['binary_path']
                command = path + ' -w=' + file_name + ' "{}" '.format(say_text)
                executor = concurrent.futures.ProcessPoolExecutor(
                    max_workers=1,
                )
                await self.loop.run_in_executor(executor, os_system, command)

            async with aiofiles.open(file_name, mode='rb') as send_file:
                audio_file = await send_file.read()
                await self.client.subscribe('hermod/{}/speaker/finished'.format(site))
                if site in self.clients and self.clients[site].get(
                        'platform', '') == "web" and self.clients[site].get('url', False):
                    await self.client.publish(\
                    'hermod/{}/speaker/play/{}'.format(site, value), payload=json.dumps({
                        "url": self.clients[site].get('url') + "/tts/" + short_file_name
                    }), qos=0)
                else:
                    slice_length = 2048

                    def chunker(seq, size):
                        """ return chunks"""
                        return (seq[pos:pos + size] for pos in range(0, len(seq), size))
                    for chunk in chunker(audio_file, slice_length):
                        await self.client.publish('hermod/{}/speaker/cache/{}'.format(site, value)\
                        , payload=bytes(chunk), qos=0)

                    # finally send play message with empty payload
                    await self.client.publish(
                        'hermod/{}/speaker/play/{}'.format(site, value), payload=None, qos=0)

                await self.cleanup_file(short_text, file_name)
