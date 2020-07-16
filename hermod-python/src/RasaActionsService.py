"""RASA actions service"""
import asyncio

from rasa_sdk.endpoint import create_app


class RasaActionsService():
    """run the RASA actions server"""
    def __init__(self, config, loop):
        """constructor"""
        self.config = config
        self.loop = loop

    async def run(self):
        """start the actions server"""
        try:
            app = create_app('actions')
            # @app.listener('after_server_start')
            # async def after_start_test(app, loop):
            # print("Async Server Started!")
            server = app.create_server(
                host="0.0.0.0",
                port=5055,
                access_log=False,
                return_asyncio_server=True)
            # loop = asyncio.get_event_loop()
            serv_task = asyncio.ensure_future(server)
            server = await serv_task
            server.after_start()
        except Exception as exception:
            print(exception)
        try:
            while True:
                await asyncio.sleep(1)
        except KeyboardInterrupt:
            server.close()
