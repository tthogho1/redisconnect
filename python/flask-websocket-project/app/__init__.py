from flask import Flask
from flask_socketio import SocketIO

def create_app():
    app = Flask(__name__)
    app.config.from_object('config')

    socketio = SocketIO(app)

    from . import routes
    from . import websocket

    return app, socketio