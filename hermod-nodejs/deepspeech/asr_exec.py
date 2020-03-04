#
# Copyright 2020 Steve Ryan <syntithenai@gmail.com>
# Based on porcupine microphone example
#
import argparse
import sys

import os
# # # add resources for pvporcupine
# sys.path.append(os.path.join(os.path.dirname(__file__), './binding/python'))
# sys.path.append(os.path.join(os.path.dirname(__file__), './resources/util/python'))

# # from pvporcupine import Porcupine
# from util import *
from asr_service import AsrService


def logprint(a):
    print(a);
    sys.stdout.flush()


def main():
    # map arguments (and defaults_
    mqtt_hostname = 'localhost'
    mqtt_port = 1883
    site = 'default'
    model_path = './model'
    if (len(sys.argv) > 1):
        mqtt_hostname = sys.argv[1];
    if (len(sys.argv) > 2):
        mqtt_port = int(sys.argv[2]);
    if (len(sys.argv) > 3):
        site = sys.argv[3];
    if (len(sys.argv) > 4):
        model_path = sys.argv[4];
   
    AsrService(
         mqtt_hostname=mqtt_hostname,
        mqtt_port=mqtt_port,
        site=site,
        model_path=model_path,
        ).run()


if __name__ == '__main__':
    main()

