"""
 Thread handler.
"""

import threading
import time

from singleton import Singleton


class ThreadHandler(Singleton):
    """ Thread handler. """

    def __init__(self):
        """ Initialisation. """
        self.thread_pool = []
        self.run_events = []

    def run(self, target, kwargs={}):
        """ Run a function in a separate thread.

        :param target: the function to run.
        :param args: the parameters to pass to the function.
        """
        run_event = threading.Event()
        run_event.set()
        kwargs['run_event'] = run_event
        thread = threading.Thread(target=target, kwargs=kwargs)
        # thread.setDaemon(True)
        self.thread_pool.append(thread)
        self.run_events.append(run_event)
        thread.start()

    def start_run_loop(self):
        """ Start the thread handler, ensuring that everything stops property
            when sending a keyboard interrup.
        """
        try:
            while True:
                time.sleep(0.00000001)
        except KeyboardInterrupt:
            self.stop()

    def stop(self):
        """ Stop all functions running in the thread handler."""
        for run_event in self.run_events:
            run_event.clear()

        for thread in self.thread_pool:
            thread.join()
