"""Google based speech recognition service"""
from __future__ import division
import asyncio
import json
import time
import threading
import queue
import numpy as np
import webrtcvad
from google.cloud import speech
from google.cloud.speech import enums
from google.cloud.speech import types
from io_buffer import BytesLoop
from MqttService import MqttService

class Transcoder(object):
    """
    Converts audio chunks to text
    """
    def __init__(self, encoding, rate, language, mqtt_client, site, last_dialog_id):
        self.buff = queue.Queue()
        self.encoding = encoding
        self.language = language
        self.rate = rate
        self.closed = False
        self.transcript = None
        self.error = None
        self.mqtt_client = mqtt_client
        self.site = site
        self.last_dialog_id = last_dialog_id

    def start(self):
        """Start up streaming speech call"""
        threading.Thread(target=self.process).start()

    def response_loop(self, responses):
        """
        Pick up the final result of Speech to text conversion
        """
        for response in responses:
            if response.error:
                print(response.error.message)
                self.error = response.error
            if not response.results:
                continue
            result = response.results[0]
            if not result.alternatives:
                continue
            transcript = result.alternatives[0].transcript
            if result.is_final:
                self.transcript = transcript
                asyncio.run(self.mqtt_client.publish('hermod/'+self.site+'/asr/text', json.dumps({
                    "id": self.last_dialog_id, 'text':self.transcript
                })))
                self.closed = True

    def process(self):
        """
        Audio stream recognition and result parsing
        """
        #You can add speech contexts for better recognition
        # cap_speech_context = types.SpeechContext(phrases=[""])
        client = speech.SpeechClient()
        config = types.RecognitionConfig(
            encoding=self.encoding,
            sample_rate_hertz=self.rate,
            language_code=self.language
            # speech_contexts=[cap_speech_context,],
            # model='command_and_search'
        )
        streaming_config = types.StreamingRecognitionConfig(
            config=config,
            interim_results=False,
            single_utterance=True)
        audio_generator = self.stream_generator()
        requests = (types.StreamingRecognizeRequest(audio_content=content)
                    for content in audio_generator)

        responses = client.streaming_recognize(streaming_config, requests)
        try:
            self.response_loop(responses)
        except Exception as e:
            print('TRANSCODER ERR')
            print(e)

    def stream_generator(self):
        """generate chunks from buffer"""
        while not self.closed:
            chunk = self.buff.get()
            if chunk is None:
                return
            data = [chunk]
            while True:
                try:
                    chunk = self.buff.get(block=False)
                    if chunk is None:
                        return
                    data.append(chunk)
                except queue.Empty:
                    break
            yield b''.join(data)

    def write(self, data):
        """
        Writes data to the buffer
        """
        self.buff.put(data)




class GoogleAsrService(MqttService):
    """
    This class listens for mqtt audio packets and publishes asr/text messages

    It integrates silence detection to slice up audio and detect the end of a spoken message
    To activate the service for a site send a message - hermod/<site>/asr/activate
    Once activated, the service will start listening for audio packets when you
    send - hermod/<site>/asr/start
    The service will continue to listen and emit hermod/<site>/asr/text messages every
    time the recognition engine can recognise some non empty text
    A hermod/<site>/asr/stop message will disable recognition
    A hermod/<site>/asr/deactivate message will garbage collect any resources related
    to the site.
    """
    RATE_PROCESS = 16000
    BLOCKS_PER_SECOND = 50

    def __init__(
            self,
            config,
            loop
    ):
        """constructor"""
        super(GoogleAsrService, self).__init__(config, loop)

        self.config = config
        self.loop = loop
        self.subscribe_to = 'hermod/+/asr/activate,hermod/+/asr/deactivate' \
        + ',hermod/+/asr/start,hermod/+/asr/stop,hermod/+/hotword/detected'

        # Create a thread-safe buffer of audio data
        self.transcoders = {}
        self.audio_stream = {} #BytesLoop()

        self.closed = {}
        self.started = {} #False
        self.active = {} #False
        self.empty_count = {}
        self.last_audio = {}
        self.audio_count = 0
        self.non_speech = {}
        self.sample_rate = self.RATE_PROCESS
        self.block_size = int(self.RATE_PROCESS / float(self.BLOCKS_PER_SECOND))
        self.frame_duration_ms = 1000 * self.block_size // self.sample_rate
        self.vad = webrtcvad.Vad(config['services']['GoogleAsrService'].get('vad_sensitivity', 1))
        self.no_packet_timeouts = {}
        self.total_time_timeouts = {}
        self.last_dialog_id = {}
        self.slice_size = 160
        if self.block_size > 320:
            self.slice_size = 320
        elif self.block_size > 480:
            self.slice_size = 480

    async def total_time_timeout(self, site, msg):
        """total timeout callback"""
        await asyncio.sleep(12)
        if site in self.no_packet_timeouts:
            self.no_packet_timeouts[site].cancel()
        self.transcoders[site].write(msg.payload)
        self.stop_transcoder(site)
        await asyncio.sleep(0.5)
        if not self.transcoders[site].transcript:
            await self.client.publish('hermod/' + site + '/asr/timeout', json.dumps({
                "id":self.last_dialog_id[site]
            }))
            await self.client.publish('hermod/' + site + '/dialog/end', json.dumps({
                "id": self.last_dialog_id[site]
            }))


    async def no_packet_timeout(self, site, msg):
        """no packets timeout callback"""
        await asyncio.sleep(3.5)
        if site in self.total_time_timeouts:
            self.total_time_timeouts[site].cancel()
        self.transcoders[site].write(msg.payload)
        self.stop_transcoder(site)
        await asyncio.sleep(0.5)
        if not self.transcoders[site].transcript:
            await self.client.publish('hermod/'+site+'/asr/timeout', json.dumps({
                "id":self.last_dialog_id[site]
            }))
            await self.client.publish('hermod/'+site+'/dialog/end', json.dumps({
                "id": self.last_dialog_id[site]
            }))

    def stop_transcoder(self, site):
        """cleanup transcoder"""
        if site in self.transcoders:
            self.transcoders[site].write(None)
            self.transcoders[site].closed = True
            self.transcoders[site].write(None)
            self.started[site] = False


    async def on_message(self, msg):
        """handle mqtt message"""
        topic = "{}".format(msg.topic)
        parts = topic.split("/")
        site = parts[1]

        if topic == 'hermod/' + site +'/asr/activate':
            pass
        elif topic == 'hermod/' + site +'/asr/deactivate':
            self.audio_stream.pop(site, '')
            self.active[site] = False
            self.started[site] = False
        elif topic == 'hermod/' + site + '/asr/start':
            payload = {}
            payload_text = msg.payload
            try:
                payload = json.loads(payload_text)
            except json.JSONDecodeError:
                pass
            self.last_dialog_id[site] = payload.get('id', '')
            self.audio_stream[site] = BytesLoop()
            self.active[site] = True
            self.started[site] = True
            self.last_audio[site] = time.time()
            self.audio_stream[site] = BytesLoop()
            # speech_contexts=[speech.types.SpeechContext(
            # phrases=['hi', 'good afternoon'],
            # )])
            self.transcoders[site] = Transcoder(
                encoding=enums.RecognitionConfig.AudioEncoding.LINEAR16,
                rate=16000,
                language=self.config['services']['GoogleAsrService']['language'],
                mqtt_client=self.client,
                site=site,
                last_dialog_id=self.last_dialog_id[site]
            )
            self.transcoders[site].start()
            await self.client.subscribe('hermod/'+site+'/microphone/audio')
            # timeout if no packets
            if site in self.no_packet_timeouts:
                self.no_packet_timeouts[site].cancel()
            self.no_packet_timeouts[site] = self.loop.create_task(self.no_packet_timeout(site, msg))
            # total time since start
            if site in self.total_time_timeouts:
                self.total_time_timeouts[site].cancel()
            self.total_time_timeouts[site] = self.loop.create_task( \
                self.total_time_timeout(site, msg))


        elif topic == 'hermod/'+site+'/asr/stop':
            # clear timeouts
            if site in self.no_packet_timeouts:
                self.no_packet_timeouts[site].cancel()
            # total time since start
            if site in self.total_time_timeouts:
                self.total_time_timeouts[site].cancel()
            self.stop_transcoder(site)
            self.started[site] = False
            await self.client.unsubscribe('hermod/'+site+'/microphone/audio')
            #self.client.publish('hermod/'+site+'/speaker/play',self.turn_off_wav)

        # elif topic == 'hermod/'+site+'/hotword/detected' :
            # self.log('clear buffer '+site)
            # if site in self.ring_buffer:
                # self.ring_buffer[site].clear()
            #self.client.publish('hermod/'+site+'/speaker/play',self.turn_off_wav)

        elif topic == 'hermod/'+site+'/microphone/audio':
            self.audio_count = self.audio_count + 1
            buffer = np.frombuffer(msg.payload, np.int16)
            frame_slice1 = self.vad.is_speech(buffer[0:480].tobytes(), self.sample_rate)
            frame_slice2 = self.vad.is_speech(buffer[480:960].tobytes(), self.sample_rate)
            if not (frame_slice1 or frame_slice2):
                self.non_speech[site] = self.non_speech.get(site, 0)
                self.non_speech[site] = self.non_speech[site] + 1
            else:
                self.non_speech[site] = 0
            payload = {}
            # ignore until started
            if site in self.transcoders and self.started[site]:
                if site in self.no_packet_timeouts:
                    self.no_packet_timeouts[site].cancel()

                self.no_packet_timeouts[site] = self.loop.create_task( \
                    self.no_packet_timeout(site, msg))
                # restrict empty packets to transcoder
                silence_cutoff = 100
                if self.non_speech[site] < silence_cutoff:
                    self.transcoders[site].closed = False
                    self.transcoders[site].write(msg.payload)

                    if self.transcoders[site].error and self.transcoders[site].error.code == 11:
                        # easy because no text expected so can send bail out messages directly
                        self.no_packet_timeouts[site].cancel()
                        self.stop_transcoder(site)
                        self.started[site] = False
                        await self.client.publish('hermod/'+site+'/asr/timeout', json.dumps({
                            "id":self.last_dialog_id[site]
                        }))
                        await self.client.publish('hermod/'+site+'/dialog/end', json.dumps({
                            "id": self.last_dialog_id[site]
                        }))

                    if self.transcoders[site].transcript:
                        self.stop_transcoder(site)

                elif self.non_speech[site] == silence_cutoff:
                    self.no_packet_timeouts[site].cancel()
                    self.transcoders[site].write(msg.payload)
                    self.stop_transcoder(site)
