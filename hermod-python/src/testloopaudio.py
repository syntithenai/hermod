#!/usr/bin/env python3
"""An example for using a stream in an asyncio coroutine.

This example shows how to create a stream in a coroutine and how to wait for
the completion of the stream.

You need Python 3.7 or newer to run this.

"""
import asyncio
import sys

import numpy as np
import sounddevice as sd
import soundfile as sf

# async def record_buffer(buffer, **kwargs):
    # loop = asyncio.get_event_loop()
    # event = asyncio.Event()
    # idx = 0

    # def callback(indata, frame_count, time_info, status):
        # nonlocal idx
        # if status:
            # print(status)
        # remainder = len(buffer) - idx
        # if remainder == 0:
            # loop.call_soon_threadsafe(event.set)
            # raise sd.CallbackStop
        # indata = indata[:remainder]
        # buffer[idx:idx + len(indata)] = indata
        # idx += len(indata)

    # stream = sd.InputStream(callback=callback, dtype=buffer.dtype,
                            # channels=buffer.shape[1], **kwargs)
    # with stream:
        # await event.wait()


async def play_buffer(buffer, **kwargs):
    loop = asyncio.get_event_loop()
    event = asyncio.Event()
    idx = 0

    def callback(outdata, frame_count, time_info, status):
        nonlocal idx
        if status:
            print(status)
        remainder = len(buffer) - idx
        if remainder == 0:
            loop.call_soon_threadsafe(event.set)
            raise sd.CallbackStop
        valid_frames = frame_count if remainder >= frame_count else remainder
        outdata[:valid_frames] = buffer[idx:idx + valid_frames]
        outdata[valid_frames:] = 0
        idx += valid_frames

    stream = sd.OutputStream(callback=callback, dtype=buffer.dtype,
                             channels=buffer.shape[1], **kwargs)
    with stream:
        await event.wait()


async def main(frames=150_000, channels=1, dtype='float32', **kwargs):
    
    # print('recording buffer ...')
    # await record_buffer(buffer, **kwargs)
    
    # blocksize=1
    # with sf.SoundFile('../www/test/audio/oklamp.wav') as f:
        # buffer = np.empty((1, f.channels), dtype=dtype)
        # data = f.buffer_read(blocksize, dtype='float32')
        # while data:
            # buffer[:] = f.read(blocksize, dtype='float32')
            # # if not data:
                # break
    
    with sf.SoundFile('../www/test/audio/oklamp.wav') as f:
        audio = f.read(always_2d=True, dtype='float32')
        await play_buffer(audio ,samplerate = f.samplerate)
        

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        sys.exit('\nInterrupted by user')
