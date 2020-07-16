"""Streaming Buffer """

class BytesLoop:
    """
    This class implements a buffer for streaming incoming mqtt packets in
    and reading fixed length chunks out for wav processing by hotword/speech engine
    """

    def __init__(self, data=b''):
        """ constructor """
        self.buffer = data

    def has_bytes(self, number_of_bytes):
        """ check if there are enough bytes in buffer for chunk read """
        return bool(number_of_bytes < 0 or (len(self.buffer) > number_of_bytes or \
        len(self.buffer) == number_of_bytes))

    def read(self, number_of_bytes=-1):
        """ read a chunk from the buffer """
        chunk = self.buffer[:number_of_bytes]
        self.buffer = self.buffer[number_of_bytes:]
        return chunk

    def length(self):
        """ return length of buffer """
        return len(self.buffer)

    def write(self, data):
        """write to the buffer """
        self.buffer += data

    def close(self):
        """ close the buffer """
        return True
