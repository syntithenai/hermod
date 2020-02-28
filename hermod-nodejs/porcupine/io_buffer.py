import sys

class BytesLoop:
    def __init__(self, s=b''):
        self.buffer = s
        
    def hasBytes(self,n):
        # self.logprint('hasbytes')
        # self.logprint(n)
        # self.logprint(len(self.buffer))
        
    #    a = 'hasBytes n {} :b {}'
        #.format(n,len(self.buffer)
     #   self.logprint(a)
        if (n < 0 or (len(self.buffer) > n or len(self.buffer) == n)):
            return True
        else:
            return False    

    def read(self, n=-1):
        self.logprint('read from buffer')
       # self.logprint(n)
       # self.logprint(self.length())
        #if (n < 0 or (len(self.buffer) >= n):
        chunk = self.buffer[:n]
        self.buffer = self.buffer[n:]
        return chunk
        #else:
        #    return False
            
    def length(self):
        return len(self.buffer)

    def write(self, s):
        self.logprint('write to buffer')
        self.logprint(len(s));
        self.logprint(self.length())
        self.buffer += s
        
    def close(self):
        return True
    
    def logprint(self,a):
        print(a);
        sys.stdout.flush()

