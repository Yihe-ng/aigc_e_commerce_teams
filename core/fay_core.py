"""Legacy compatibility wrapper for the old Fay core import path.

The Live2D migration now uses ``core.avatar_core`` as the canonical module.
This file remains only so older imports keep working during the transition.
"""

from core.avatar_core import *  # noqa: F401,F403
from core.avatar_core import FeiFei as FeiFei

