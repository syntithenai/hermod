"""Google Speech to Text Service"""
import json
import os
import concurrent.futures
import asyncio
import unicodedata
import string
from pathlib import Path
from google.cloud import texttospeech
import aiofiles
from MqttService import MqttService


valid_filename_chars = "-_() %s%s" % (string.ascii_letters, string.digits)
CHAR_LIMIT = 240

# seed random number generator


def write_speech(text, config):
    """ use google api to generate speech """
    client = texttospeech.TextToSpeechClient()
    # Set the text input to be synthesized
    input_text = texttospeech.SynthesisInput(text=text)
    voice = texttospeech.VoiceSelectionParams(
        language_code=config.get('language', 'en-AU'),
        ssml_gender=texttospeech.SsmlVoiceGender.NEUTRAL)

    # Select the type of audio file you want returned
    audio_config = texttospeech.AudioConfig(
        audio_encoding=texttospeech.AudioEncoding.MP3)

    # Perform the text-to-speech request on the text input with the selected
    # voice parameters and audio file type
    response = client.synthesize_speech(
        request={"input": input_text, "voice": voice,
                 "audio_config": audio_config}
    )

    return response.audio_content


def clean_filename(filename, whitelist=valid_filename_chars, replace=' '):
    """return a clean filename for generated speech"""
    for letter in replace:
        filename = filename.replace(letter, '_')

    # keep only valid ascii chars
    cleaned_filename = unicodedata.normalize(
        'NFKD', filename).encode('ASCII', 'ignore').decode()

    # keep only whitelisted chars
    cleaned_filename = ''.join(clean for clean in cleaned_filename if clean in whitelist)
    return cleaned_filename[:CHAR_LIMIT]


def my_run_in_executor(executor, the_function, *args):
    """run a non asyncio function asynchronously with arguments"""
    return asyncio.wrap_future(executor.submit(the_function, *args))


class GoogleTtsService(MqttService):
    """
    This class listens for tts/say messages and triggers a sequence of messages
    that result in the text message being converted to wav audio and played through the speaker
     service
    TODO Where the text is very long, it is split into parts and sent sequentially.
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
            GoogleTtsService,
            self).__init__(config, loop)
        self.config = config
        self.clients = {}
        self.subscribe_to = 'hermod/+/tts/say,hermod/+/dialog/init'
        cache_path = self.config['services']['GoogleTtsService'].get(
            'cache_path', '/tmp/tts_cache')
        Path(cache_path).mkdir(parents=True, exist_ok=True)

    async def on_message(self, msg):
        """handle mqtt message"""
        self.log('message {}'.format(msg))
        topic = "{}".format(msg.topic)
        parts = topic.split('/')
        site = parts[1]
        payload = {}
        try:
            payload = json.loads(msg.payload)
        except json.JSONDecodeError:
            pass
        text = payload.get('text', '')
        if topic == 'hermod/' + site + '/tts/say' and len(text) > 0:
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
        """delete file acter a short delay (to allow download)"""
        await asyncio.sleep(3)
        # cache short texts
        if len(short_text) > self.config.get('cache_max_letters', 100):
            os.remove(file_name)

    async def generate_audio(self, site, text, payload):
        """ Use system binary pico2wav to generate audio file from text then send audio as mqtt"""
        value = payload.get('id', 'no_id')
        if len(text) > 0:
            # filename limits
            short_text = text[0:100].replace(' ', '_').replace(".", "")
            # speakable and limited
            say_text = text[0:300].replace('(', '').replace(')', '')
            short_file_name = clean_filename('tts-' + str(short_text)) + '.mp3'
            file_name = os.path.join(self.config['services']['GoogleTtsService'].get('cache_path', \
            '/tmp/tts_cache'), short_file_name)

            # generate if file doesn't exist in cache
            audio_file = None
            if not os.path.isfile(file_name):
                with concurrent.futures.ThreadPoolExecutor() as executor:
                    audio_file = await my_run_in_executor(executor, write_speech, \
                    say_text, self.config)
                async with aiofiles.open(file_name, mode='wb') as the_file:
                    await the_file.write(audio_file)
                async with aiofiles.open(file_name, mode='rb') as the_file:
                    audio_file = await the_file.read()
            await self.client.subscribe('hermod/{}/speaker/finished'.format(site))
            if site in self.clients and self.clients[site].get('platform', '') == "web" \
            and self.clients[site].get('url', False):
                await self.client.publish(
                    'hermod/{}/speaker/play/{}'.format(site, value), payload=json.dumps({
                        "url": self.clients[site].get('url') + "/tts/" + short_file_name
                    }), qos=0)
            else:
                slice_length = 16000

                def chunker(seq, size):
                    return (seq[pos:pos + size]
                            for pos in range(0, len(seq), size))

                # lc = 0
                # ts = 0
                for the_slice in chunker(audio_file, slice_length):
                    # lc = lc + 1
                    # ts = ts + len(the_slice)
                    await self.client.publish('hermod/{}/speaker/cache/{}'.format(site, value), \
                    payload=bytes(the_slice), qos=0)

                await self.client.publish(
                    'hermod/{}/speaker/play/{}'.format(site, value), payload=None, qos=0)

            await self.cleanup_file(short_text, file_name)
