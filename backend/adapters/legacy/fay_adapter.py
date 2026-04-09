import avatar_runtime


class LegacyFayAdapter:
    """Compatibility adapter so legacy Fay-era code does not pollute new flows."""

    DeviceInputListenerDict = avatar_runtime.DeviceInputListenerDict

    def start(self):
        return avatar_runtime.start()

    def stop(self):
        return avatar_runtime.stop()

    def restart(self):
        return avatar_runtime.restart()

    def is_running(self):
        return avatar_runtime.is_running()

    def get_instance(self):
        return avatar_runtime.get_instance()


legacy_fay_adapter = LegacyFayAdapter()

