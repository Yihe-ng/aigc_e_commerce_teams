export type LipSyncSocketMessage = {
  type?: string
  timestamp?: number
  mouth_open?: number
  request_id?: string
  rms?: number
  short_energy?: number
}

const MOUTH_VISUAL_GAIN = 1.45
const MOUTH_VISUAL_FLOOR = 0.035
const MOUTH_FORM_MIN = -0.32
const MOUTH_FORM_MAX = 0.46

export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

export function smoothTowards(current: number, target: number, alpha: number, epsilon = 0.0015) {
  const next = current + (target - current) * alpha
  if (Math.abs(target - next) <= epsilon) {
    return target
  }
  return next
}

export function computeMouthForm(mouthOpen: number) {
  if (mouthOpen <= 0.02) {
    return 0
  }

  const normalized = clamp(mouthOpen, 0, 1)

  // 低开口时给一点横向收紧感，中高开口再逐渐过渡到更圆、更明显的嘴型。
  if (normalized < 0.12) {
    return MOUTH_FORM_MIN * (normalized / 0.12)
  }

  if (normalized < 0.32) {
    const progress = (normalized - 0.12) / 0.2
    return MOUTH_FORM_MIN + (0.02 - MOUTH_FORM_MIN) * progress
  }

  if (normalized < 0.62) {
    const progress = (normalized - 0.32) / 0.3
    return 0.02 + (0.24 - 0.02) * progress
  }

  const progress = (normalized - 0.62) / 0.38
  return 0.24 + (MOUTH_FORM_MAX - 0.24) * progress
}

export function computeLipSyncDelay(timestamp?: number, now = Date.now()) {
  if (typeof timestamp !== 'number') {
    return 0
  }
  return Math.max(0, Math.min(60, timestamp - now))
}

export function normalizeMouthOpen(value: number | undefined) {
  const normalized = clamp(typeof value === 'number' ? value : 0, 0, 1)
  if (normalized <= MOUTH_VISUAL_FLOOR) {
    return 0
  }
  return clamp(normalized * MOUTH_VISUAL_GAIN, 0, 1)
}
