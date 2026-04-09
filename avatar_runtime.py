import threading

from core.avatar_core import AvatarCore
from core import wsa_server

_lock = threading.RLock()
avatar_instance = None
DeviceInputListenerDict = {}


def start():
    global avatar_instance
    with _lock:
        try:
            wsa_server.ensure_bootstrap()
        except Exception:
            pass
        if avatar_instance is None:
            avatar_instance = AvatarCore()
            avatar_instance.start()
        return avatar_instance


def stop():
    global avatar_instance
    with _lock:
        if avatar_instance is not None:
            avatar_instance.stop()
            avatar_instance = None


def restart():
    stop()
    return start()


def is_running():
    with _lock:
        return avatar_instance is not None


def get_instance():
    with _lock:
        return avatar_instance
