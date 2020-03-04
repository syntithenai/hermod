# -*- coding: utf-8 -*-

## Author:   James Spencer: http://stackoverflow.com/users/1375885/james-spencer
## Packager: Gijs Timmers:  https://github.com/GijsTimmers

## Based on James Spencer's answer on StackOverflow: 
## http://stackoverflow.com/q/5174810

## Licence:  GPL v3
## https://www.gnu.org/licenses/gpl-3.0.html 

import sys
import os

if os.name == 'nt':
    import ctypes

    class _CursorInfo(ctypes.Structure):
        _fields_ = [("size", ctypes.c_int),
                    ("visible", ctypes.c_byte)]

def hide(stream=sys.stdout):
    if os.name == 'nt':
        ci = _CursorInfo()
        handle = ctypes.windll.kernel32.GetStdHandle(-11)
        ctypes.windll.kernel32.GetConsoleCursorInfo(handle, ctypes.byref(ci))
        ci.visible = False
        ctypes.windll.kernel32.SetConsoleCursorInfo(handle, ctypes.byref(ci))
    elif os.name == 'posix':
        stream.write("\033[?25l")
        stream.flush()

def show(stream=sys.stdout):
    if os.name == 'nt':
        ci = _CursorInfo()
        handle = ctypes.windll.kernel32.GetStdHandle(-11)
        ctypes.windll.kernel32.GetConsoleCursorInfo(handle, ctypes.byref(ci))
        ci.visible = True
        ctypes.windll.kernel32.SetConsoleCursorInfo(handle, ctypes.byref(ci))
    elif os.name == 'posix':
        stream.write("\033[?25h")
        stream.flush()
        
class HiddenCursor(object):
    def __init__(self, stream=sys.stdout):
        self._stream = stream
    def __enter__(self):
        hide(stream=self._stream)
    def __exit__(self, type, value, traceback):
        show(stream=self._stream)
