"""
This class implements a buffer for streaming incoming mqtt packets in
and reading fixed length chunks out for wav processing by hotword/speech engine
"""


class BytesLoop:
    """
    Chunking buffer
    """
    def __init__(self, s=b''):
        self.buffer = s

    def has_bytes(self, n):
        return bool(n < 0 or (len(self.buffer) > n or len(self.buffer) == n))

    def read(self, n=-1):
        chunk = self.buffer[:n]
        self.buffer = self.buffer[n:]
        return chunk

    def length(self):
        return len(self.buffer)

    def write(self, s):
        self.buffer += s

    def close(self):
        return True
