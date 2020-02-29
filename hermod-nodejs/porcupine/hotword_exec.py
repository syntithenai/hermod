#
# Copyright 2020 Steve Ryan <syntithenai@gmail.com>
# Based on porcupine microphone example
#
import argparse
import sys

import os
# # add resources for pvporcupine
sys.path.append(os.path.join(os.path.dirname(__file__), './binding/python'))
sys.path.append(os.path.join(os.path.dirname(__file__), './resources/util/python'))

# from pvporcupine import Porcupine
from util import *
from hotword_service import HotwordService


def logprint(a):
    print(a);
    sys.stdout.flush()


def main():
    # map arguments (and defaults_
    mqtt_hostname = 'localhost'
    mqtt_port = 1883
    site = 'default'
    keywords_p = 'picovoice'
    sense_p = 0.5
    if (len(sys.argv) > 1):
        mqtt_hostname = sys.argv[1];
    if (len(sys.argv) > 2):
        mqtt_port = int(sys.argv[2]);
    if (len(sys.argv) > 3):
        site = sys.argv[3];
    if (len(sys.argv) > 4):
        keywords_p = sys.argv[4];
    if (len(sys.argv) > 5):
        sense_p = sys.argv[5];
   
    # setup keyword and sensitivity arrays
    keywords = [x.strip() for x in keywords_p.split(',')]
    logprint('args kw ok')
    if all(x in KEYWORDS for x in keywords):
        keyword_file_paths = [KEYWORD_FILE_PATHS[x] for x in keywords]
    else:
        raise ValueError(
            'selected keywords are not available by default. available keywords are: %s' % ', '.join(KEYWORDS))

    if isinstance(sense_p, float):
        sensitivities = [sense_p] * len(keyword_file_paths)
    else:
        sensitivities = [float(x) for x in sense_p.split(',')]
   
    HotwordService(
        library_path=LIBRARY_PATH,
        model_file_path=MODEL_FILE_PATH,
        keyword_file_paths=keyword_file_paths,
        sensitivities=sensitivities,
        output_path='',
        input_device_index=None,
        mqtt_hostname=mqtt_hostname,
        mqtt_port=mqtt_port,
        site=site).run()


if __name__ == '__main__':
    main()

