"""Deepspeech based Speech Recognition Service"""

import os
import os.path
import json
import asyncio
import collections
import deepspeech
import numpy as np
import webrtcvad
from io_buffer import BytesLoop
from MqttService import MqttService


class DeepspeechAsrService(MqttService):

    """
    This class listens for mqtt audio packets and publishes asr/text messages

    It integrates silence detection to slice up audio and detect the end of a spoken message
    Based on the deepspeech examples repository python streaming example.
    To activate the service for a site send a message - hermod/<site>/asr/activate
    Once activated, the service will start listening for audio packets when you
    send - hermod/<site>/asr/start
    The service will continue to listen and emit hermod/<site>/asr/text messages every
    time the deepspeech engine can recognise some non empty text
    A hermod/<site>/asr/stop message will disable recognition while still leaving a
    loaded deepspeech transcription instance for the site so it can be reenabled instantly
    A hermod/<site>/asr/deactivate message will garbage collect any resources related to the site.
    """

    RATE_PROCESS = 16000
    CHANNELS = 1
    BLOCKS_PER_SECOND = 50

    def __init__(
            self,
            config,
            loop
    ):
        """ contructor """
        self.config = config
        self.loop = loop

        super(DeepspeechAsrService, self).__init__(config, loop)

        self.sample_rate = self.RATE_PROCESS
        self.block_size = int(self.RATE_PROCESS /
                              float(self.BLOCKS_PER_SECOND))
        self.frame_duration_ms = 1000 * self.block_size // self.sample_rate
        # webrtcvad.Vad(config['services']['DeepspeechAsrService'].get('vad_sensitivity',1))
        self.vad = webrtcvad.Vad(2)
        self.model_path = config['services']['DeepspeechAsrService']['model_path']
        self.model_file = 'deepspeech-0.7.0-models.pbmm'
        self.subscribe_to = 'hermod/+/asr/activate,hermod/+/asr/deactivate' \
        + ',hermod/+/asr/start,hermod/+/asr/stop,hermod/+/hotword/detected'

        # TFLITE model for ARM architecture
        # system,  release, version, machine, processor = os.uname()
        #self.log([system,  release, version, machine, processor])
        # if processor == 'armv7l':
            # self.modelFile = 'deepspeech-0.7.0-models.tflite'

        self.last_start_id = {}  # for passing dialog id when not given in message -  per site
        self.audio_stream = {}  # BytesLoop()  buffer for passing mqtt -> deepspeech  -  per site
        self.started = {}  # False  got started message for sessison -  per site
        self.active = {}  # False  got active message for session -  per site
        self.empty_count = {}  # tally empty transcripts and bail after 3 empty -  per site
        self.stream_contexts = {}  # Deepspeech engine stream contexts - per site
        self.no_packet_timeouts = {}
        self.total_time_timeouts = {}
        # preload notification sounds
        # this_folder = os.path.dirname(os.path.realpath(__file__))
        # wav_file = os.path.join(this_folder, 'turn_off.wav')
        # f = open(wav_file, "rb")
        # self.turn_off_wav = f.read();
        self.models = deepspeech.Model(os.path.join(self.model_path, self.model_file))
        self.models.enableExternalScorer(os.path.join(
            self.model_path, 'deepspeech-0.7.0-models.scorer'))

    async def on_message(self, msg):
        """ handle mqtt message """
        topic = "{}".format(msg.topic)
        parts = topic.split("/")
        site = parts[1]

        if topic == 'hermod/' + site+'/asr/activate':
            self.log('activate ASR '+site)
            await self.activate(site)
        elif topic == 'hermod/' + site+'/asr/deactivate':
            self.log('deactivate ASR '+site)
            await self.deactivate(site)
        elif topic == 'hermod/' + site+'/asr/start':
            self.log('start ASR '+site)
            await self.client.subscribe('hermod/'+site+'/microphone/audio')
            self.started[site] = True
            payload = {}
            try:
                payload = json.loads(msg.payload)
            except json.JSONDecodeError:
                pass
            self.last_start_id[site] = payload.get('id', '')

            self.clear_timeouts(site)
            # timeout if no packets
            self.start_timeouts(site)

            # start asr processing in background
            self.loop.create_task(self.start_asr_vad(site))

        elif topic == 'hermod/'+site+'/asr/stop':
            await self.client.unsubscribe('hermod/'+site+'/microphone/audio')
            self.log('stop ASR '+site)
            self.started[site] = False
            self.clear_timeouts(site)

        elif topic == 'hermod/'+site+'/microphone/audio':
            # and  site in self.is_speaking and not self.is_speaking[site]:
            if site in self.started and self.started[site]:
                self.audio_stream[site].write(msg.payload)

    async def activate(self, site):
        """ initialise and activate service for a site  """
        if os.path.isdir(self.model_path):
            self.audio_stream[site] = BytesLoop()
            self.active[site] = True
            self.started[site] = False
            self.stream_contexts[site] = self.models.createStream()
        else:
            raise Exception("Could not load Deepspeech model file")

    async def deactivate(self, site):
        """ deactivate service for a site  """
        self.audio_stream.pop(site, '')
        self.active[site] = False
        self.started[site] = False

    def clear_timeouts(self, site):
        """ cancel the timeout coroutines """
        # try:
            # clear timeouts
        if site in self.no_packet_timeouts and self.no_packet_timeouts[site]:
            self.no_packet_timeouts[site].cancel()
            self.no_packet_timeouts[site] = None
        # total time since start
        if site in self.total_time_timeouts and self.total_time_timeouts[site]:
            self.total_time_timeouts[site].cancel()
            self.no_packet_timeouts[site] = None
        # except:
            # pass

    def start_timeouts(self, site):
        """ create the timeout routines """
        try:
            self.no_packet_timeouts[site] = self.loop.create_task(
                self.no_packet_timeout(site))
        except asyncio.CancelledError as exception:
            self.log(exception)
        # total time since start
        try:
            self.total_time_timeouts[site] = self.loop.create_task(
                self.total_time_timeout(site))
        except asyncio.CancelledError as exception:
            self.log(exception)

    async def total_time_timeout(self, site):
        """ total timeout callback  """
        await asyncio.sleep(4)
        if site in self.no_packet_timeouts and self.no_packet_timeouts[site]:
            try:
                self.no_packet_timeouts[site].cancel()
            except asyncio.CancelledError as exception:
                self.log(exception)

            del self.no_packet_timeouts[site]
        await self.finish_stream(site)

    async def no_packet_timeout(self, site):
        """ no packets callback """
        await asyncio.sleep(2)
        if site in self.total_time_timeouts and self.total_time_timeouts[site]:
            try:
                self.total_time_timeouts[site].cancel()
            except asyncio.CancelledError as exception:
                self.log(exception)
            del self.total_time_timeouts[site]
        await self.finish_stream(site)

    async def timeout(self, site):
        """ send timeout messages  """
        await self.client.publish('hermod/'+site+'/asr/timeout', json.dumps({
            "id": self.last_start_id.get(site, '')
        }))
        await self.client.publish('hermod/'+site+'/dialog/end', json.dumps({
            "id": self.last_start_id.get(site, '')
        }))
        self.started[site] = False

    async def finish_stream(self, site):
        """ finish recognition stream """
        text = self.stream_contexts[site].finishStream()
        if len(text) > 0:
            self.empty_count[site] = 0
            await self.client.publish('hermod/'+site+'/asr/text', json.dumps({
                'text': text,
                "id": self.last_start_id.get(site, '')
            }))
            self.started[site] = False
            del self.stream_contexts[site]
        else:
            if self.empty_count[site] > 2:
                self.started[site] = False
                await self.timeout(site)
            self.empty_count[site] = self.empty_count[site] + 1
            self.stream_contexts[site] = self.models.createStream()
            self.clear_timeouts(site)
            self.start_timeouts(site)

    async def start_asr_vad(self, site=''):
        """ start a recognition stream for a site"""
        if site not in self.active or not self.active[site]:
            await self.activate(site)
        self.empty_count[site] = 0
        self.stream_contexts[site] = self.models.createStream()
        while self.started[site]:
            if (site in self.active and site in self.started \
            and site in self.stream_contexts and self.active[site]):
                async for frame in self.vad_collector(site):
                    if self.started[site]:
                        if frame is not None:
                            try:
                                self.stream_contexts[site].feedAudioContent(
                                    np.frombuffer(frame, np.int16))
                                if site in self.no_packet_timeouts:
                                    self.no_packet_timeouts[site].cancel()
                                self.no_packet_timeouts[site] = self.loop.create_task(
                                    self.no_packet_timeout(site))
                            except:
                                self.log('error feeding content')
                        else:
                            await self.finish_stream(site)

    # async def startASR(self, site):
        # """ start a recognition stream for a site"""
        # empty_count = {}
        # if os.path.isdir(self.model_path):
            # self.started[site] = True
            # await self.start_asr_vad(site)
        # else:
            # self.log('missing model files at '+self.model_path)

    # # coroutine

    async def frame_generator(self, site):
        """Generator that yields all audio frames."""
        silence_count = 0
        while True and self.started[site]:
            if site in self.audio_stream and self.audio_stream[site].has_bytes(self.block_size*2):
                silence_count = 0
                yield self.audio_stream[site].read(self.block_size*2)
            else:
                # hand off control to other frame generators without yielding a value
                silence_count = silence_count + 1
                await asyncio.sleep(0.01)

    # original padding_ms=300
    async def vad_collector(self, site, padding_ms=400, ratio_start=0.55, ratio_stop=0.95, frames=None):
        """ Generator that yields series of consecutive audio frames comprising each
            utterence, separated by yielding a single None.
            Determines voice activity by ratio of frames in padding_ms.
            Uses a buffer to include padding_ms prior to being triggered.
            Example: (frame, ..., frame, None, frame, ..., frame, None, ...)
                      |---utterence---|        |---utterence---|
        """
        num_padding_frames = padding_ms // self.frame_duration_ms
        ring_buffer = collections.deque(maxlen=num_padding_frames)
        triggered = False
        async for frame in self.frame_generator(site):
            if len(frame) < 1:
                pass
            else:
                is_speech = self.vad.is_speech(frame, self.sample_rate)
                if not triggered:
                    ring_buffer.append((frame, is_speech))
                    num_voiced = len(
                        [f for f, speech in ring_buffer if speech])
                    if num_voiced > ratio_start * ring_buffer.maxlen:
                        triggered = True
                        for f, s in ring_buffer:
                            yield f
                        ring_buffer.clear()

                else:
                    yield frame
                    ring_buffer.append((frame, is_speech))
                    num_unvoiced = len(
                        [f for f, speech in ring_buffer if not speech])
                    if num_unvoiced > ratio_stop * ring_buffer.maxlen:
                        triggered = False
                        yield None
                        ring_buffer.clear()
