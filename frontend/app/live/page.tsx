'use client'

import React, { startTransition, useEffect, useRef, useState } from 'react'
import PendulumClock from '@/components/widgets/PendulumClock'
import MinimalClock from '@/components/widgets/MinimalClock'
import NeonStrips, { useNeonState } from '@/components/widgets/NeonStrips'
import './live.css'

let PIXI: typeof import('pixi.js') | null = null
let Live2DModel: typeof import('pixi-live2d-display/cubism4').Live2DModel | null = null

type CubismWindow = Window & {
  Live2DCubismCore?: unknown
}

type Live2DModelWithTicker = typeof import('pixi-live2d-display/cubism4').Live2DModel & {
  registerTicker: (ticker: typeof import('pixi.js').Ticker) => void
}

type InteractiveLive2DModel = import('pixi-live2d-display/cubism4').Live2DModel & {
  on: (event: 'hit', handler: (hitAreas: string[]) => void) => void
  motion: (name: string) => void
}

type Live2DCoreModelController = {
  setParameterValueById: (id: string, value: number) => void
}

type StageReadyModel = import('pixi-live2d-display/cubism4').Live2DModel & {
  internalModel?: {
    coreModel?: Live2DCoreModelController
  }
}

type LiveTab = 'chat' | 'product'
type LiveStage = 'idle' | 'connecting' | 'listening' | 'thinking' | 'speaking' | 'offline'

type ChatMessage = {
  id: string
  user: string
  message: string
  level: string
  color: string
}

type HistoryMessageItem = {
  type?: string
  content?: string
  username?: string
  createtime?: string
  timetext?: string
  uid?: number
}

type PanelReply = {
  type?: 'member' | 'avatar' | 'assistant' | string
  content?: string
  username?: string
  uid?: number
}

type WsPayload = {
  panelMsg?: string
  panelReply?: PanelReply
  is_connect?: boolean
  remote_audio_connect?: boolean
  liveState?: number
  robot?: string
}

type LatestAudioPayload = {
  request_id?: string
  audio?: {
    filename?: string
    mtime_ms?: number
    url?: string
  } | null
}

type PendingAudio = {
  src: string
  key: string
}

const DEFAULT_USER = 'User'
const MAX_CHAT_MESSAGES = 80
const LEGACY_AVATAR_MESSAGE_TYPES = new Set(['avatar', 'assistant', 'fay'])

const SPEAKER_STYLES: Record<string, { level: string; color: string }> = {
  system: { level: 'SYS', color: '#ff4d4f' },
  member: { level: 'UL5', color: '#00aeec' },
  avatar: { level: 'AI', color: '#7c3aed' },
}

function trimMessages(messages: ChatMessage[]) {
  return messages.slice(-MAX_CHAT_MESSAGES)
}

function createMessage(
  user: string,
  message: string,
  type: 'system' | 'member' | 'avatar',
  id?: string,
): ChatMessage {
  const style = SPEAKER_STYLES[type]
  return {
    id: id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    user,
    message,
    level: style.level,
    color: style.color,
  }
}

function buildHistoryMessageId(item: HistoryMessageItem, kind: 'member' | 'avatar') {
  const username = item.username || (kind === 'avatar' ? 'Avatar' : DEFAULT_USER)
  const timePart = item.createtime || item.timetext || 'no-time'
  const content = (item.content || '').trim()
  return `${kind}|${username}|${timePart}|${content}`
}

function createClientRequestId() {
  return `live-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function summarizeForLog(value: string, limit = 48) {
  const compact = value.replace(/\s+/g, ' ').trim()
  return compact.length > limit ? `${compact.slice(0, limit)}...` : compact
}

function logClientTrace(stage: string, payload: Record<string, unknown>) {
  console.info('[live-trace]', {
    module: 'live_frontend',
    stage,
    ...payload,
  })
}

function getAsrErrorMessage(errorCode?: string) {
  switch (errorCode) {
    case 'ffmpeg_missing':
      return 'ASR 依赖缺失，请检查 ffmpeg'
    case 'provider_unreachable':
      return 'ASR 服务不可达，请检查 8001'
    case 'provider_error':
      return 'ASR 服务返回异常'
    case 'empty_text':
      return '未识别到有效语音'
    default:
      return 'ASR 失败，请稍后再试'
  }
}

function isAvatarMessageType(type?: string) {
  return typeof type === 'string' && LEGACY_AVATAR_MESSAGE_TYPES.has(type)
}

function useEvent<T extends (...args: never[]) => unknown>(callback: T): T {
  const callbackRef = useRef(callback)
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  const stableRef = useRef<T>(((...args: never[]) => callbackRef.current(...args)) as T)
  return stableRef.current
}

export default function LivePage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const chatListRef = useRef<HTMLDivElement>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const websocketRef = useRef<WebSocket | null>(null)
  const activeSocketIdRef = useRef(0)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const speakingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const audioPulseTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const recordingChunksRef = useRef<Blob[]>([])
  const lastInteractionAtRef = useRef(0)
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null)
  const latestAudioRequestRef = useRef(0)
  const lastPlayedAudioKeyRef = useRef('')
  const replySyncTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const recentMessageKeysRef = useRef<string[]>([])
  const live2dModelRef = useRef<StageReadyModel | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const analyserDataRef = useRef<Uint8Array<ArrayBuffer> | null>(null)
  const audioSourceRef = useRef<MediaElementAudioSourceNode | null>(null)
  const lipSyncFrameRef = useRef<number | null>(null)
  const mouthOpenRef = useRef(0)
  const manualStopRef = useRef(false)
  const activeTraceRequestIdRef = useRef('')
  const isAudioPollingRef = useRef(false)
  const activeAudioPollSinceRef = useRef(0)
  const activeAudioPollTokenRef = useRef(0)

  const [activeTab, setActiveTab] = useState<LiveTab>('chat')
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    createMessage('系统通知', '直播页已接入现有 Live2D 服务链路。', 'system'),
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [panelMessage, setPanelMessage] = useState('待机中')
  const [stageStatus, setStageStatus] = useState<LiveStage>('offline')
  const [liveState, setLiveState] = useState<number>(0)
  const [isHumanConnected, setIsHumanConnected] = useState(false)
  const [remoteAudioConnected, setRemoteAudioConnected] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)
  const [pendingAudio, setPendingAudio] = useState<PendingAudio | null>(null)

  const { state: neonState, audioLevel, setState: setNeonState, setAudioLevel } = useNeonState()
  const deviceRuntimeLabel = isHumanConnected ? '数字人设备已连接' : '数字人设备未连接'
  const remoteAudioLabel = remoteAudioConnected ? '远端设备音频已连接' : '远端设备音频未连接'
  const browserAudioLabel = isPlayingAudio ? '浏览器音频播放中' : '浏览器音频空闲'

  const getApiBaseUrl = useEvent(() => {
    if (typeof window === 'undefined') {
      return 'http://localhost:5000'
    }
    // Use localhost to match the frontend origin and avoid CORS issues
    return 'http://localhost:5000'
  })

  const getWsUrl = useEvent(() => {
    if (typeof window === 'undefined') {
      return 'ws://127.0.0.1:10003'
    }
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    return `${protocol}//${window.location.hostname}:10003`
  })

  const stopAudioPulse = useEvent(() => {
    if (audioPulseTimerRef.current) {
      clearInterval(audioPulseTimerRef.current)
      audioPulseTimerRef.current = null
    }
    setAudioLevel(0)
  })

  const stopReplySync = useEvent(() => {
    if (replySyncTimerRef.current) {
      clearInterval(replySyncTimerRef.current)
      replySyncTimerRef.current = null
    }
  })

  const setModelMouthOpen = useEvent((value: number) => {
    const normalized = Math.max(0, Math.min(1, value))
    mouthOpenRef.current = normalized
    live2dModelRef.current?.internalModel?.coreModel?.setParameterValueById('ParamMouthOpenY', normalized)
  })

  const stopLipSync = useEvent(() => {
    if (lipSyncFrameRef.current) {
      cancelAnimationFrame(lipSyncFrameRef.current)
      lipSyncFrameRef.current = null
    }
    if (audioSourceRef.current) {
      try {
        audioSourceRef.current.disconnect()
      } catch {
        // Ignore disconnect failures during teardown.
      }
      audioSourceRef.current = null
    }
    if (analyserRef.current) {
      try {
        analyserRef.current.disconnect()
      } catch {
        // Ignore disconnect failures during teardown.
      }
      analyserRef.current = null
    }
    if (audioContextRef.current) {
      void audioContextRef.current.close().catch(() => undefined)
      audioContextRef.current = null
    }
    analyserDataRef.current = null
    setModelMouthOpen(0)
  })

  const startLipSync = useEvent((player: HTMLAudioElement) => {
    if (typeof window === 'undefined') {
      return
    }

    const AudioContextCtor = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioContextCtor) {
      return
    }

    stopLipSync()

    try {
      const context = new AudioContextCtor()
      const analyser = context.createAnalyser()
      analyser.fftSize = 256
      analyser.smoothingTimeConstant = 0.72

      const source = context.createMediaElementSource(player)
      source.connect(analyser)
      analyser.connect(context.destination)

      const dataArray = new Uint8Array(analyser.frequencyBinCount)
      audioContextRef.current = context
      analyserRef.current = analyser
      analyserDataRef.current = dataArray
      audioSourceRef.current = source

      const tick = () => {
        const activeAnalyser = analyserRef.current
        const activeData = analyserDataRef.current
        if (!activeAnalyser || !activeData) {
          return
        }

        activeAnalyser.getByteFrequencyData(activeData)
        let sum = 0
        for (let i = 0; i < activeData.length; i += 1) {
          sum += activeData[i]
        }

        const average = sum / activeData.length / 255
        const target = average < 0.03 ? 0 : Math.min(1, average * 2.8)
        const smoothed = mouthOpenRef.current + (target - mouthOpenRef.current) * 0.35
        setModelMouthOpen(smoothed)
        lipSyncFrameRef.current = requestAnimationFrame(tick)
      }

      if (context.state === 'suspended') {
        void context.resume().catch(() => undefined)
      }
      tick()
    } catch {
      setModelMouthOpen(0)
    }
  })

  const stopNativeAudio = useEvent(() => {
    latestAudioRequestRef.current = -1
    const player = audioPlayerRef.current
    stopLipSync()
    if (player) {
      player.pause()
      player.currentTime = 0
      audioPlayerRef.current = null
    }
    setIsPlayingAudio(false)
  })

  const playAudioTrack = useEvent(
    async (src: string, audioKey: string, trace: { request_id?: string; filename?: string } = {}) => {
      stopNativeAudio()
      const player = new window.Audio()
      player.crossOrigin = 'anonymous'
      player.src = src
      audioPlayerRef.current = player
      lastPlayedAudioKeyRef.current = audioKey
      setPendingAudio(null)

      player.onplay = () => {
        logClientTrace('audio_play', {
          request_id: trace.request_id || '',
          status: 'playing',
          filename: trace.filename || '',
        })
        setIsPlayingAudio(true)
        setPendingAudio(null)
        startLipSync(player)
        pulseSpeakingState(3200)
      }

      player.onended = () => {
        logClientTrace('audio_play', {
          request_id: trace.request_id || '',
          status: 'ended',
          filename: trace.filename || '',
        })
        setIsPlayingAudio(false)
        audioPlayerRef.current = null
        stopLipSync()
        if (stageStatus !== 'thinking' && stageStatus !== 'listening') {
          enterIdleState()
        }
      }

      player.onerror = () => {
        logClientTrace('audio_play', {
          request_id: trace.request_id || '',
          status: 'error',
          filename: trace.filename || '',
          error: 'audio_element_error',
        })
        setIsPlayingAudio(false)
        audioPlayerRef.current = null
        stopLipSync()
        setPendingAudio({ src, key: audioKey })
        setPanelMessage('音频文件已生成，但浏览器播放失败')
        appendChatMessage(createMessage('系统通知', '音频文件已生成，但浏览器未能播放，请点击“播放最新语音”重试。', 'system'))
      }

      try {
        await player.play()
      } catch (error) {
        logClientTrace('audio_play', {
          request_id: trace.request_id || '',
          status: 'blocked',
          filename: trace.filename || '',
          error: error instanceof Error ? error.message : 'autoplay_blocked',
        })
        setIsPlayingAudio(false)
        audioPlayerRef.current = null
        stopLipSync()
        setPendingAudio({ src, key: audioKey })
        setPanelMessage('音频已生成，但浏览器阻止了自动播放')
        appendChatMessage(
          createMessage(
            '系统通知',
            '音频已生成，但浏览器阻止了自动播放。请点击“播放最新语音”继续播放。',
            'system',
          ),
        )
        console.error('Audio autoplay failed', error)
      }
    },
  )

  const releaseMicrophone = useEvent(() => {
    mediaRecorderRef.current = null
    const stream = mediaStreamRef.current
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      mediaStreamRef.current = null
    }
    recordingChunksRef.current = []
    setIsRecording(false)
  })

  const enterIdleState = useEvent(() => {
    stopAudioPulse()
    setNeonState('idle')
    setStageStatus(liveState === 1 ? 'idle' : 'offline')
  })

  const pulseSpeakingState = useEvent((duration = 2600) => {
    stopAudioPulse()
    setIsPlayingAudio(true)
    setStageStatus('speaking')
    setNeonState('speaking')
    audioPulseTimerRef.current = setInterval(() => {
      setAudioLevel(Math.random() * 55 + 35)
    }, 120)
    if (speakingTimerRef.current) {
      clearTimeout(speakingTimerRef.current)
    }
    speakingTimerRef.current = setTimeout(() => {
      stopAudioPulse()
      setIsPlayingAudio(false)
      if (panelMessage.includes('思考')) {
        setNeonState('thinking')
        setStageStatus('thinking')
        return
      }
      enterIdleState()
    }, duration)
  })

  const appendChatMessage = useEvent((message: ChatMessage) => {
    const messageKey = `${message.level}|${message.user}|${message.message.trim()}`
    if (recentMessageKeysRef.current.includes(messageKey)) {
      return
    }
    recentMessageKeysRef.current = [...recentMessageKeysRef.current.slice(-30), messageKey]
    startTransition(() => {
      setChatMessages((prev) => trimMessages([...prev, message]))
    })
  })

  const startReplySync = useEvent((since: number) => {
    stopReplySync()
    let attempts = 0
    replySyncTimerRef.current = setInterval(() => {
      attempts += 1
      void fetchMessageHistory()
      void pollLatestAudio(since)
      if (attempts >= 12) {
        stopReplySync()
      }
    }, 1500)
  })

  const scrollChatToBottom = useEvent((behavior: ScrollBehavior = 'smooth') => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior, block: 'end' })
      return
    }
    const list = chatListRef.current
    if (list) {
      list.scrollTo({ top: list.scrollHeight, behavior })
    }
  })

  const fetchMessageHistory = useEvent(async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/get-msg`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `data=${encodeURIComponent(JSON.stringify({ username: DEFAULT_USER }))}`,
      })
      if (!response.ok) {
        return
      }
      const payload = (await response.json()) as { list?: HistoryMessageItem[] }
      if (!payload.list?.length) {
        return
      }
      const history = payload.list
        .map((item) => {
          const kind = isAvatarMessageType(item.type) ? 'avatar' : 'member'
          return createMessage(
            item.username || (kind === 'avatar' ? 'Avatar' : DEFAULT_USER),
            item.content || '',
            kind,
            buildHistoryMessageId(item, kind),
          )
        })
        .filter((item) => item.message.trim().length > 0)
      if (!history.length) {
        return
      }
      recentMessageKeysRef.current = history
        .slice(-30)
        .map((item) => `${item.level}|${item.user}|${item.message.trim()}`)
      setChatMessages((prev) => {
        const nextMessages = trimMessages(history)
        if (
          prev.length === nextMessages.length &&
          prev.every((item, index) =>
            item.id === nextMessages[index]?.id &&
            item.message === nextMessages[index]?.message &&
            item.user === nextMessages[index]?.user &&
            item.level === nextMessages[index]?.level,
          )
        ) {
          return prev
        }
        return nextMessages
      })
      requestAnimationFrame(() => {
        scrollChatToBottom('auto')
      })
    } catch {
      // Keep the page usable even if history loading fails.
    }
  })

  const fetchRuntimeStatus = useEvent(async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/ws-status`)
      if (!response.ok) {
        return
      }
      const payload = (await response.json()) as {
        avatar_running?: boolean
        ui_server_running?: boolean
        human_server_running?: boolean
        human_client_connected?: boolean
      }

      const running = Boolean(
        payload.avatar_running || (payload.ui_server_running && payload.human_server_running),
      )
      setLiveState(running ? 1 : 0)
      setIsHumanConnected(Boolean(payload.human_client_connected))

      if (running) {
        manualStopRef.current = false
        setStageStatus('idle')
        setNeonState('idle')
        setPanelMessage('检测到现有直播服务正在运行')
      } else if (manualStopRef.current) {
        setStageStatus('offline')
        setNeonState('idle')
      }
    } catch {
      // Ignore runtime status failures and rely on WebSocket reconnection.
    }
  })

  const pollLatestAudio = useEvent(async (since: number) => {
    if (!since || typeof window === 'undefined') {
      return
    }

    if (isAudioPollingRef.current && activeAudioPollSinceRef.current === since) {
      return
    }

    const requestId = Date.now()
    const traceRequestId = activeTraceRequestIdRef.current || createClientRequestId()
    const pollToken = Date.now() + Math.floor(Math.random() * 1000)
    latestAudioRequestRef.current = requestId
    activeAudioPollSinceRef.current = since
    activeAudioPollTokenRef.current = pollToken
    isAudioPollingRef.current = true
    logClientTrace('latest_audio_poll', {
      request_id: traceRequestId,
      status: 'start',
      since,
    })

    for (let attempt = 0; attempt < 30; attempt += 1) {
      if (activeAudioPollTokenRef.current !== pollToken) {
        return
      }
      try {
        const response = await fetch(`${getApiBaseUrl()}/api/latest-audio?since=${since}&request_id=${encodeURIComponent(traceRequestId)}`)
        if (response.ok) {
          const payload = (await response.json()) as LatestAudioPayload
          const effectiveRequestId = payload.request_id || traceRequestId
          const audio = payload.audio
          if (audio?.url) {
            if (latestAudioRequestRef.current !== requestId) {
              return
            }
            isAudioPollingRef.current = false

            const audioKey = `${audio.filename ?? ''}:${audio.mtime_ms ?? ''}`
            if (audioKey && lastPlayedAudioKeyRef.current === audioKey) {
              return
            }

            logClientTrace('latest_audio_poll', {
              request_id: effectiveRequestId,
              status: 'hit',
              since,
              attempt: attempt + 1,
              filename: audio?.filename || '',
              mtime_ms: audio?.mtime_ms || '',
            })

            await playAudioTrack(
              `${getApiBaseUrl()}${audio.url}?t=${audio.mtime_ms ?? Date.now()}`,
              audioKey,
              { request_id: effectiveRequestId, filename: audio.filename || '' },
            )
            return
          }
        }
      } catch (error) {
        isAudioPollingRef.current = false
        logClientTrace('latest_audio_poll', {
          request_id: traceRequestId,
          status: 'error',
          since,
          attempt: attempt + 1,
          error: error instanceof Error ? error.message : 'latest_audio_failed',
        })
        // Keep polling while the backend finishes writing the sample file.
        return
      }

      await new Promise((resolve) => setTimeout(resolve, 800))
    }

    if (activeAudioPollTokenRef.current === pollToken) {
      isAudioPollingRef.current = false
      logClientTrace('latest_audio_poll', {
        request_id: traceRequestId,
        status: 'timeout',
        since,
      })
    }
  })

  const handleIncomingMessage = useEvent((data: WsPayload) => {
    if (typeof data.liveState === 'number') {
      setLiveState(data.liveState)
      if (data.liveState === 1 && stageStatus === 'offline') {
        setStageStatus('idle')
        setNeonState('idle')
      }
      if (data.liveState === 0) {
        setStageStatus('offline')
        setNeonState('idle')
        stopAudioPulse()
        stopNativeAudio()
      }
    }

    if (typeof data.is_connect === 'boolean') {
      setIsHumanConnected(data.is_connect)
    }

    if (typeof data.remote_audio_connect === 'boolean') {
      setRemoteAudioConnected(data.remote_audio_connect)
    }

    if (typeof data.panelMsg === 'string') {
      const nextMessage = data.panelMsg.trim()
      logClientTrace('ws_panel_msg', {
        request_id: activeTraceRequestIdRef.current || '',
        status: 'ok',
        message_preview: summarizeForLog(nextMessage),
      })
      setPanelMessage(nextMessage || '待机中')
      if (!nextMessage) {
        enterIdleState()
      } else if (nextMessage.includes('思考')) {
        stopAudioPulse()
        setStageStatus('thinking')
        setNeonState('thinking')
      } else if (nextMessage.includes('聆听') || nextMessage.includes('唤醒')) {
        stopAudioPulse()
        setStageStatus('listening')
        setNeonState('hot')
      } else {
        pulseSpeakingState()
      }
    }

    if (data.panelReply?.content) {
      const isAvatar = isAvatarMessageType(data.panelReply.type)
      const user = data.panelReply.username || (isAvatar ? 'Avatar' : DEFAULT_USER)
      logClientTrace('ws_panel_reply', {
        request_id: activeTraceRequestIdRef.current || '',
        status: 'ok',
        reply_type: data.panelReply.type || '',
        text_len: data.panelReply.content.length,
        text_preview: summarizeForLog(data.panelReply.content),
      })
      appendChatMessage(createMessage(user, data.panelReply.content, isAvatar ? 'avatar' : 'member'))
      if (isAvatar) {
        pulseSpeakingState()
        if (lastInteractionAtRef.current > 0) {
          void pollLatestAudio(lastInteractionAtRef.current)
        }
      }
    }
  })

  const connectWebSocket = useEvent(() => {
    if (manualStopRef.current) {
      return
    }
    const existingSocket = websocketRef.current
    if (existingSocket && (existingSocket.readyState === WebSocket.OPEN || existingSocket.readyState === WebSocket.CONNECTING)) {
      return
    }

    setStageStatus((prev) => (prev === 'offline' ? 'connecting' : prev))
    const socket = new WebSocket(getWsUrl())
    const socketId = Date.now() + Math.floor(Math.random() * 1000)
    activeSocketIdRef.current = socketId
    websocketRef.current = socket

    socket.onopen = () => {
      if (activeSocketIdRef.current !== socketId) {
        socket.close()
        return
      }
      setStageStatus(liveState === 1 ? 'idle' : 'connecting')
      setPanelMessage(liveState === 1 ? '已连接面板服务' : '面板已连接，等待直播启动')
      socket.send(JSON.stringify({ Username: DEFAULT_USER }))
      void fetchMessageHistory()
    }

    socket.onmessage = (event) => {
      if (activeSocketIdRef.current !== socketId) {
        return
      }
      try {
        handleIncomingMessage(JSON.parse(event.data) as WsPayload)
      } catch {
        // Ignore malformed frames and keep the connection alive.
      }
    }

    socket.onclose = () => {
      if (activeSocketIdRef.current === socketId) {
        websocketRef.current = null
      }
      stopAudioPulse()
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current)
      }
      if (activeSocketIdRef.current !== socketId) {
        return
      }
      if (manualStopRef.current) {
        setStageStatus('offline')
        setNeonState('idle')
        return
      }
      setStageStatus((prev) => (liveState === 1 ? 'connecting' : prev === 'offline' ? 'offline' : 'connecting'))
      reconnectTimerRef.current = setTimeout(() => {
        connectWebSocket()
      }, 3000)
    }

    socket.onerror = () => {
      socket.close()
    }
  })

  const postJson = useEvent(async (path: string, body?: Record<string, unknown>, requestId?: string) => {
    const response = await fetch(`${getApiBaseUrl()}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(requestId ? { 'X-Request-Id': requestId } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    })
    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`)
    }
    return response
  })

  const ensureLiveReady = useEvent(async () => {
    if (liveState === 1) {
      return true
    }

    manualStopRef.current = false
    setStageStatus('connecting')
    setPanelMessage('正在自动启动直播服务...')

    try {
      await postJson('/api/start-live')
      setLiveState(1)
      setStageStatus('idle')
      setNeonState('idle')
      setPanelMessage('直播服务已自动启动')
      connectWebSocket()
      return true
    } catch {
      appendChatMessage(createMessage('系统通知', '直播服务尚未启动，自动启动失败，请检查后端。', 'system'))
      setPanelMessage('自动启动失败，请检查后端服务')
      setStageStatus('offline')
      return false
    }
  })

  const submitInteractionText = useEvent(async (rawText: string) => {
    const text = rawText.trim()
    if (!text || isSending) {
      return
    }
    if (!(await ensureLiveReady())) {
      return
    }

    setIsSending(true)
    const requestId = createClientRequestId()
    activeTraceRequestIdRef.current = requestId
    lastInteractionAtRef.current = Date.now()
    appendChatMessage(createMessage(DEFAULT_USER, text, 'member'))
    setPanelMessage('消息已提交，等待数字人响应...')
    logClientTrace('chat_submit', {
      request_id: requestId,
      status: 'start',
      text_len: text.length,
      text_preview: summarizeForLog(text),
    })

    try {
      const response = await postJson('/api/chat', {
        user: DEFAULT_USER,
        text,
      }, requestId)
      const payload = (await response.json()) as { request_id?: string }
      const effectiveRequestId = payload.request_id || requestId
      activeTraceRequestIdRef.current = effectiveRequestId
      logClientTrace('chat_submit', {
        request_id: effectiveRequestId,
        status: 'ok',
      })
      setInputMessage('')
      void fetchMessageHistory()
      void pollLatestAudio(lastInteractionAtRef.current)
      startReplySync(lastInteractionAtRef.current)
    } catch (error) {
      logClientTrace('chat_submit', {
        request_id: requestId,
        status: 'error',
        error: error instanceof Error ? error.message : 'chat_failed',
      })
      appendChatMessage(createMessage('系统通知', '消息发送失败，请检查后端服务。', 'system'))
      setPanelMessage('消息发送失败')
    } finally {
      setIsSending(false)
    }
  })

  const transcribeRecordedAudio = useEvent(async (audioBlob: Blob) => {
    setIsTranscribing(true)
    setPanelMessage('正在进行 ASR 转写...')
    const requestId = createClientRequestId()
    logClientTrace('asr_submit', {
      request_id: requestId,
      status: 'start',
      audio_size: audioBlob.size,
      audio_type: audioBlob.type || 'unknown',
    })

    const formData = new FormData()
    formData.append('file', audioBlob, 'live-recording.webm')

    try {
      const response = await fetch(`${getApiBaseUrl()}/api/asr`, {
        method: 'POST',
        headers: {
          'X-Request-Id': requestId,
        },
        body: formData,
      })
      const payload = (await response.json()) as { text?: string; detail?: string; error?: string; error_code?: string; request_id?: string }
      const effectiveRequestId = payload.request_id || requestId
      if (!response.ok) {
        const message = getAsrErrorMessage(payload.error_code || payload.error)
        logClientTrace('asr_submit', {
          request_id: effectiveRequestId,
          status: 'error',
          error: payload.error_code || payload.error || 'asr_failed',
          detail: payload.detail || '',
        })
        setPanelMessage(message)
        enterIdleState()
        return
      }

      const transcript = (payload.text || '').trim()
      logClientTrace('asr_submit', {
        request_id: effectiveRequestId,
        status: transcript ? 'ok' : 'empty',
        text_len: transcript.length,
        text_preview: summarizeForLog(transcript),
      })
      if (!transcript) {
        setPanelMessage('未识别到有效语音')
        enterIdleState()
        return
      }

      setInputMessage(transcript)
      await submitInteractionText(transcript)
    } catch (error) {
      logClientTrace('asr_submit', {
        request_id: requestId,
        status: 'error',
        error: error instanceof Error ? error.message : 'asr_failed',
      })
      setPanelMessage(getAsrErrorMessage())
      enterIdleState()
    } finally {
      setIsTranscribing(false)
    }
  })

  const handleStartLive = useEvent(async () => {
    manualStopRef.current = false
    setStageStatus('connecting')
    setPanelMessage('正在启动直播服务...')
    try {
      await postJson('/api/start-live')
      setLiveState(1)
      setPanelMessage('直播服务已启动')
      setStageStatus('idle')
      connectWebSocket()
    } catch {
      setPanelMessage('启动失败，请检查后端服务')
      setStageStatus('offline')
    }
  })

  const handleStopLive = useEvent(async () => {
    manualStopRef.current = true
    setPanelMessage('正在停止直播服务...')
    try {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current)
        reconnectTimerRef.current = null
      }
      await postJson('/api/stop-live')
      setLiveState(0)
      setStageStatus('offline')
      setNeonState('idle')
      stopAudioPulse()
      stopNativeAudio()
      releaseMicrophone()
      stopReplySync()
      if (websocketRef.current) {
        websocketRef.current.close()
        websocketRef.current = null
      }
      setPanelMessage('直播服务已停止')
    } catch {
      setPanelMessage('停止失败，请稍后重试')
    }
  })

  const handleSendMessage = useEvent(async () => {
    await submitInteractionText(inputMessage)
  })

  const handleToggleRecording = useEvent(async () => {
    if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setPanelMessage('当前浏览器不支持麦克风录音')
      return
    }

    if (isRecording) {
      mediaRecorderRef.current?.stop()
      return
    }

    if (!(await ensureLiveReady())) {
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaStreamRef.current = stream
      recordingChunksRef.current = []

      const recorder = new MediaRecorder(stream)
      mediaRecorderRef.current = recorder
      setIsRecording(true)
      setStageStatus('listening')
      setNeonState('hot')
      setPanelMessage('聆听中...')

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordingChunksRef.current.push(event.data)
        }
      }

      recorder.onstop = () => {
        const audioBlob = new Blob(recordingChunksRef.current, {
          type: recorder.mimeType || 'audio/webm',
        })
        releaseMicrophone()
        if (audioBlob.size > 0) {
          void transcribeRecordedAudio(audioBlob)
        } else {
          enterIdleState()
        }
      }

      recorder.onerror = () => {
        releaseMicrophone()
        setPanelMessage('录音中断，请重试')
        enterIdleState()
      }

      recorder.start()
    } catch {
      releaseMicrophone()
      setPanelMessage('无法访问麦克风，请检查浏览器权限')
      enterIdleState()
    }
  })

  const waitForCubismRuntime = useEvent((): Promise<void> => {
    return new Promise((resolve) => {
      if (typeof window === 'undefined') {
        resolve()
        return
      }
      if ((window as CubismWindow).Live2DCubismCore) {
        resolve()
        return
      }
      const checkInterval = setInterval(() => {
        if ((window as CubismWindow).Live2DCubismCore) {
          clearInterval(checkInterval)
          resolve()
        }
      }, 100)
      setTimeout(() => {
        clearInterval(checkInterval)
        resolve()
      }, 10000)
    })
  })

  useEffect(() => {
    if (!containerRef.current || typeof window === 'undefined') {
      return
    }

    let app: import('pixi.js').Application | null = null
    let model: import('pixi-live2d-display/cubism4').Live2DModel | null = null
    const container = containerRef.current

    const initLive2D = async () => {
      try {
        await waitForCubismRuntime()

        if (!PIXI) {
          PIXI = await import('pixi.js')
        }
        if (!Live2DModel) {
          const live2dModule = await import('pixi-live2d-display/cubism4')
          Live2DModel = live2dModule.Live2DModel
        }

        ;(Live2DModel as Live2DModelWithTicker).registerTicker(PIXI.Ticker)

        const containerWidth = container.offsetWidth
        const containerHeight = container.offsetHeight

        if (getComputedStyle(container).position === 'static') {
          container.style.position = 'relative'
        }

        const canvas = document.createElement('canvas')
        canvas.width = containerWidth
        canvas.height = containerHeight
        canvas.style.width = '100%'
        canvas.style.height = '100%'
        canvas.style.display = 'block'
        canvas.style.position = 'absolute'
        canvas.style.top = '0'
        canvas.style.left = '0'
        canvas.id = 'live2d-canvas'
        container.appendChild(canvas)

        app = new PIXI.Application({
          view: canvas,
          width: containerWidth,
          height: containerHeight,
          backgroundAlpha: 0,
          antialias: false,
          resolution: 1,
          autoDensity: false,
        })

        model = await Live2DModel.from('/runtime/hiyori_pro_t11.model3.json')
        app.stage.addChild(model)
        live2dModelRef.current = model as StageReadyModel

        const scaleX = (containerWidth * 0.9) / model.width
        const scaleY = (containerHeight * 0.95) / model.height
        const baseScale = Math.min(scaleX, scaleY)
        const scale = baseScale * 1.3

        model.scale.set(scale, scale)
        model.anchor.set(0.5, 0.5)
        model.position.set(containerWidth * 0.42, containerHeight * 0.58)

        ;(model as InteractiveLive2DModel).on('hit', (hitAreas: string[]) => {
          if (hitAreas.includes('body')) {
            ;(model as InteractiveLive2DModel).motion('TapBody')
          }
        })
      } catch (error) {
        console.error('Live2D initialization failed', error)
      }
    }

    const timer = setTimeout(() => {
      void initLive2D()
    }, 100)

    return () => {
      clearTimeout(timer)
      live2dModelRef.current = null
      setModelMouthOpen(0)
      if (model) {
        model.destroy()
      }
      if (app) {
        app.destroy(true)
      }
      const canvas = container.querySelector('canvas')
      if (canvas) {
        canvas.remove()
      }
    }
  }, [waitForCubismRuntime])

  useEffect(() => {
    void fetchRuntimeStatus()
    connectWebSocket()

    return () => {
      activeSocketIdRef.current += 1
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current)
      }
      if (speakingTimerRef.current) {
        clearTimeout(speakingTimerRef.current)
      }
      if (websocketRef.current) {
        websocketRef.current.close()
      }
      stopReplySync()
      stopNativeAudio()
      releaseMicrophone()
      stopAudioPulse()
      stopLipSync()
    }
  }, [connectWebSocket, fetchRuntimeStatus, releaseMicrophone, stopAudioPulse, stopLipSync, stopNativeAudio, stopReplySync])

  useEffect(() => {
    requestAnimationFrame(() => {
      scrollChatToBottom(chatMessages.length <= 2 ? 'auto' : 'smooth')
    })
  }, [chatMessages, scrollChatToBottom])

  const serviceLabel =
    stageStatus === 'thinking'
      ? '思考中'
      : stageStatus === 'speaking'
        ? '说话中'
        : stageStatus === 'listening'
          ? '聆听中'
          : stageStatus === 'connecting'
            ? '连接中'
            : stageStatus === 'offline'
              ? '未启动'
              : '待机中'

  return (
    <div className="ecommerce-live">
      <header className="header">
        <div className="logo-area">
          <span className="logo-icon">AI</span>
          <span className="logo-text">AITuber Live</span>
        </div>
        <div className="header-right">
          <div className="live-indicator">
            <span className="live-dot"></span>
            <span className="live-text">{liveState === 1 ? 'LIVE' : 'READY'}</span>
          </div>
          <div className="viewer-count">
            <span className="viewer-icon">WS</span>
            <span>{stageStatus === 'offline' ? 'offline' : 'online'}</span>
          </div>
        </div>
      </header>

      <main className="main-container">
        <div className="live-column">
          <MinimalClock />
          <div className="host-info">
            <div className="avatar"></div>
            <div className="host-details">
              <div className="host-name">Live2D Host</div>
              <div className="host-topic">{panelMessage}</div>
            </div>
            <div className="live-status">{serviceLabel}</div>
          </div>

          <NeonStrips state={neonState} audioLevel={audioLevel} />

          <div className="live2d-view" ref={containerRef}>
            <div className="stage-decoration">
              <div className="stage-light"></div>
              <div className="brand-badge">
                <span className="brand-icon">AI</span>
                <span className="brand-text">Avatar Runtime</span>
              </div>
              <div className="product-corner">
                <div className="corner-item">
                  <span className="corner-icon">WS</span>
                  <span className="corner-text">{deviceRuntimeLabel}</span>
                </div>
              </div>
            </div>

            <PendulumClock />

            <div className="neon-control-panel">
              <div className="neon-control-title">Live Runtime</div>
              <div className="live-runtime-grid">
                <span className="runtime-chip">服务: {liveState === 1 ? '运行中' : '未启动'}</span>
                <span className="runtime-chip">用户: {DEFAULT_USER}</span>
                <span className="runtime-chip">{remoteAudioLabel}</span>
                <span className="runtime-chip">麦克风: {isRecording ? '录音中' : isTranscribing ? '转写中' : '待命'}</span>
                <span className="runtime-chip">{browserAudioLabel}</span>
              </div>
              <div className="neon-controls">
                <button className={`neon-btn ${liveState === 1 ? 'active' : ''}`} onClick={handleStartLive}>
                  启动
                </button>
                <button className="neon-btn" onClick={handleStopLive}>
                  停止
                </button>
                <button className={`neon-btn ${stageStatus === 'thinking' ? 'active' : ''}`} onClick={() => void fetchMessageHistory()}>
                  刷新
                </button>
                <button
                  className={`neon-btn ${isRecording ? 'active' : ''}`}
                  onClick={() => void handleToggleRecording()}
                  disabled={isTranscribing || isSending}
                >
                  {isRecording ? '停止收音' : isTranscribing ? 'ASR 中' : '麦克风'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="chat-column">
          <div className="tabs">
            <div className={`tab ${activeTab === 'chat' ? 'active' : ''}`} onClick={() => setActiveTab('chat')}>
              互动聊天
            </div>
            <div className={`tab ${activeTab === 'product' ? 'active' : ''}`} onClick={() => setActiveTab('product')}>
              运行状态
            </div>
          </div>

          {activeTab === 'chat' ? (
            <>
              <div className="chat-list" ref={chatListRef}>
                {chatMessages.map((msg, index) => (
                  <div key={msg.id} className="chat-item" style={{ animationDelay: `${index * 0.03}s` }}>
                    <div className="chat-header">
                      <span className="user-level" style={{ backgroundColor: msg.color }}>
                        {msg.level}
                      </span>
                      <span className="chat-user">{msg.user}</span>
                    </div>
                    <span className="chat-message">{msg.message}</span>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <div className="input-bar">
                <button
                  className={`voice-btn ${isRecording ? 'recording' : ''}`}
                  onClick={() => void handleToggleRecording()}
                  title={isRecording ? '停止收音' : '点击开始收音'}
                  type="button"
                >
                  <svg className="mic-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" y1="19" x2="12" y2="23" />
                    <line x1="8" y1="23" x2="16" y2="23" />
                  </svg>
                </button>
                <input
                  type="text"
                  placeholder={liveState === 1 ? '输入文本，走现有 Live2D NLP 链路...' : '请先启动直播服务'}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      void handleSendMessage()
                    }
                  }}
                />
                <button className="aux-btn" onClick={() => void handleToggleRecording()} disabled={isSending || isTranscribing}>
                  {isRecording ? '停止' : '语音'}
                </button>
                <button onClick={() => void handleSendMessage()} disabled={isSending || isTranscribing}>
                  {isSending ? '发送中' : '发送'}
                </button>
              </div>
            </>
          ) : (
            <div className="product-list">
              <div className="product-card">
                <div className="product-image"></div>
                <div className="product-info">
                  <div className="product-name">ASR / NLP / 情感分析</div>
                  <div className="status-copy">
                    当前页面通过现有 Live2D 后端链路触发文本互动，并消费 WebSocket 回推结果。
                  </div>
                  <button className="buy-btn" onClick={() => void fetchMessageHistory()}>
                    同步历史
                  </button>
                </div>
              </div>
              <div className="product-card">
                <div className="product-image"></div>
                <div className="product-info">
                  <div className="product-name">WebSocket 状态</div>
                  <div className="status-copy">
                    面板: {stageStatus === 'offline' ? '未连接' : '已连接'} / 数字人设备: {isHumanConnected ? '已连接' : '未连接'}
                  </div>
                  <button className="buy-btn" onClick={connectWebSocket}>
                    重连面板
                  </button>
                </div>
              </div>
              <div className="product-card">
                <div className="product-image"></div>
                <div className="product-info">
                  <div className="product-name">浏览器音频链路</div>
                  <div className="status-copy">
                    麦克风录音走 5000 主服务的 ASR 代理，TTS wav 由浏览器原生 Audio 直接播放。远端设备音频仅在外接数字人设备时才会连接。
                  </div>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button className="buy-btn" onClick={stopNativeAudio}>
                      停止播放
                    </button>
                    {pendingAudio ? (
                      <button
                        className="buy-btn"
                        onClick={() => void playAudioTrack(pendingAudio.src, pendingAudio.key)}
                      >
                        播放最新语音
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
