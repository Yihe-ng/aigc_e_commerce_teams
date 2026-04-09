import avatar_runtime

# 兼容旧版 Fay 启动接口。
# 新代码应优先使用 avatar_runtime，这里只保留兼容导入。

DeviceInputListenerDict = avatar_runtime.DeviceInputListenerDict


def __getattr__(name):
    if name == "feiFei":
        return avatar_runtime.get_instance()
    raise AttributeError(name)


def start():
    return avatar_runtime.start()


def stop():
    return avatar_runtime.stop()


def restart():
    return avatar_runtime.restart()


def is_running():
    return avatar_runtime.is_running()
