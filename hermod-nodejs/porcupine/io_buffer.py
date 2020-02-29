# buffer for streaming incoming mqtt and reading fixed length chunks for wav processing by hotword/speech engine
import sys

class BytesLoop:
    def __init__(self, s=b''):
        self.buffer = s
        
    def hasBytes(self,n):
       if (n < 0 or (len(self.buffer) > n or len(self.buffer) == n)):
            return True
       else:
            return False    

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
    
