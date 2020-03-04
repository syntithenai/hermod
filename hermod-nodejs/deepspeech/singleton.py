# -*-: coding utf-8 -*-
""" Singleton class. """


class Singleton(object):
    """ Singleton class. """

    _instance = None

    def __new__(cls, *args, **kwargs):
        """ Initialisation. """
        if not cls._instance:
            cls._instance = super(Singleton, cls).__new__(cls)
        return cls._instance
