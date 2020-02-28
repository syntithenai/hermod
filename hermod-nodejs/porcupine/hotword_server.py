#
# Copyright 2020 Steve Ryan <syntithenai@gmail.com>
# Based on porcupine microphone example
#

import argparse
#import paho.mqtt.client as mqtt
import sys

import os
# import struct
# from datetime import datetime
# from threading import Thread
# import json
# import time
# import wave
# import io
# from socket import error as socket_error
# import warnings
# import numpy as np
# #import pyaudio
# import soundfile

# from io_buffer import BytesLoop
# from thread_handler import ThreadHandler
# # add resources for pvporcupine
sys.path.append(os.path.join(os.path.dirname(__file__), './binding/python'))
sys.path.append(os.path.join(os.path.dirname(__file__), './resources/util/python'))

# from pvporcupine import Porcupine
from util import *
from porcupine_demo import PorcupineDemo


def logprint(a):
    print(a);
    sys.stdout.flush()



def main():
    logprint('main')
    #return
    parser = argparse.ArgumentParser()

    parser.add_argument('--mqtt_hostname', help='mqtt hostname eg localhost', default='localhost')

    parser.add_argument('--mqtt_port', help='mqtt port number', default='1883')

    parser.add_argument('--site', help='hermod site id', default='jest')

    parser.add_argument('--keywords', help='comma-separated list of default keywords (%s)' % ', '.join(KEYWORDS), default='picovoice,bumblebee,porcupine')

    parser.add_argument('--keyword_file_paths', help='comma-separated absolute paths to keyword files')

    parser.add_argument('--library_path', help="absolute path to Porcupine's dynamic library", default=LIBRARY_PATH)

    parser.add_argument('--model_file_path', help='absolute path to model parameter file', default=MODEL_FILE_PATH)

    parser.add_argument('--sensitivities', help='detection sensitivity [0, 1]', default=0.5)

    parser.add_argument('--input_audio_device_index', help='index of input audio device', type=int, default=None)

    parser.add_argument(
        '--output_path',
        help='absolute path to where recorded audio will be stored. If not set, it will be bypassed.')

    
    args = parser.parse_args()
    logprint('main args')

    if args.keyword_file_paths is None:
        if args.keywords is None:
            raise ValueError('either --keywords or --keyword_file_paths must be set')

        keywords = [x.strip() for x in args.keywords.split(',')]
        logprint('args kw ok')
        if all(x in KEYWORDS for x in keywords):
            keyword_file_paths = [KEYWORD_FILE_PATHS[x] for x in keywords]
        else:
            raise ValueError(
                'selected keywords are not available by default. available keywords are: %s' % ', '.join(KEYWORDS))
    else:
        keyword_file_paths = [x.strip() for x in args.keyword_file_paths.split(',')]
        logprint('args kw done')

    if isinstance(args.sensitivities, float):
        sensitivities = [args.sensitivities] * len(keyword_file_paths)
    else:
        sensitivities = [float(x) for x in args.sensitivities.split(',')]
    logprint('args sense done')
    PorcupineDemo(
        library_path=args.library_path,
        model_file_path=args.model_file_path,
        keyword_file_paths=keyword_file_paths,
        sensitivities=sensitivities,
        output_path=args.output_path,
        input_device_index=args.input_audio_device_index,
        mqtt_hostname=args.mqtt_hostname,
        mqtt_port=args.mqtt_port,
        site=args.site).run()


logprint('__NAME__  {}'.format(__name__))

if __name__ == '__main__':
    main()



logprint('done file')
