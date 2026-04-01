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

type LiveTab = 'chat' | 'product'
type LiveStage = 'idle' | 'connecting' | 'listening' | 'thinking' | 'speaking' | 'offline'

type ChatMessage = {
  user: string
  message: string
  level: string
  color: string
}

type PanelReply = {
  type?: 'member' | 'fay' | string
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
  audio?: {
    filename?: string
    mtime_ms?: number
    url?: string
  } | null
}

const DEFAULT_USER = 'User'
const MAX_CHAT_MESSAGES = 80

const SPEAKER_STYLES: Record<string, { level: string; color: string }> = {
  system: { level: 'SYS', color: '#ff4d4f' },
  member: { level: 'UL5', color: '#00aeec' },
  fay: { level: 'AI', color: '#7c3aed' },
}

function trimMessages(messages: ChatMessage[]) {
  return messages.slice(-MAX_CHAT_MESSAGES)
}

function createMessage(user: string, message: string, type: 'system' | 'member' | 'fay'): ChatMessage {
  const style = SPEAKER_STYLES[type]
  return {
    user,
    message,
    level: style.level,
    color: style.color,
  }
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
  const websocketRef = useRef<WebSocket | null>(null)
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

  const [activeTab, setActiveTab] = useState<LiveTab>('chat')
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    createMessage('系统通知', '直播页已接入现有 Fay 服务链路。', 'system'),
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

  const { state: neonState, audioLevel, setState: setNeonState, setAudioLevel } = useNeonState()

  const getApiBaseUrl = useEvent(() => {
    if (typeof window === 'undefined') {
      return 'http://127.0.0.1:5000'
    }
    return `${window.location.protocol}//${window.location.hostname}:5000`
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

  const stopNativeAudio = useEvent(() => {
    const player = audioPlayerRef.current
    if (player) {
      player.pause()
      player.currentTime = 0
      audioPlayerRef.current = null
    }
    setIsPlayingAudio(false)
  })

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
    startTransition(() => {
      setChatMessages((prev) => trimMessages([...prev, message]))
    })
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
      const payload = (await response.json()) as { list?: Array<{ type?: string; content?: string; username?: string }> }
      if (!payload.list?.length) {
        return
      }
      const history = payload.list
        .map((item) => {
          const kind = item.type === 'fay' ? 'fay' : 'member'
          return createMessage(item.username || (kind === 'fay' ? 'Fay' : DEFAULT_USER), item.content || '', kind)
        })
        .filter((item) => item.message.trim().length > 0)
      if (!history.length) {
        return
      }
      setChatMessages(trimMessages(history))
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
        ui_server_running?: boolean
        human_server_running?: boolean
        human_client_connected?: boolean
      }

      const running = Boolean(payload.ui_server_running && payload.human_server_running)
      setLiveState(running ? 1 : 0)
      setIsHumanConnected(Boolean(payload.human_client_connected))

      if (running) {
        setStageStatus('idle')
        setNeonState('idle')
        setPanelMessage('检测到现有直播服务正在运行')
      }
    } catch {
      // Ignore runtime status failures and rely on WebSocket reconnection.
    }
  })

  const pollLatestAudio = useEvent(async (since: number) => {
    if (!since || typeof window === 'undefined') {
      return
    }

    const requestId = Date.now()
    latestAudioRequestRef.current = requestId

    for (let attempt = 0; attempt < 10; attempt += 1) {
      try {
        const response = await fetch(`${getApiBaseUrl()}/api/latest-audio?since=${since}`)
        if (response.ok) {
          const payload = (await response.json()) as LatestAudioPayload
          const audio = payload.audio
          if (audio?.url) {
            if (latestAudioRequestRef.current !== requestId) {
              return
            }

            const audioKey = `${audio.filename ?? ''}:${audio.mtime_ms ?? ''}`
            if (audioKey && lastPlayedAudioKeyRef.current === audioKey) {
              return
            }

            stopNativeAudio()
            const player = new window.Audio(`${getApiBaseUrl()}${audio.url}?t=${audio.mtime_ms ?? Date.now()}`)
            audioPlayerRef.current = player
            lastPlayedAudioKeyRef.current = audioKey
            player.onplay = () => {
              setIsPlayingAudio(true)
              pulseSpeakingState(3200)
            }
            player.onended = () => {
              setIsPlayingAudio(false)
              audioPlayerRef.current = null
              if (stageStatus !== 'thinking' && stageStatus !== 'listening') {
                enterIdleState()
              }
            }
            player.onerror = () => {
              setIsPlayingAudio(false)
              audioPlayerRef.current = null
            }

            try {
              await player.play()
            } catch {
              setIsPlayingAudio(false)
              audioPlayerRef.current = null
            }
            return
          }
        }
      } catch {
        // Keep polling while the backend finishes writing the sample file.
      }

      await new Promise((resolve) => setTimeout(resolve, 500))
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
      const isFay = data.panelReply.type === 'fay'
      const user = data.panelReply.username || (isFay ? 'Fay' : DEFAULT_USER)
      appendChatMessage(createMessage(user, data.panelReply.content, isFay ? 'fay' : 'member'))
      if (isFay) {
        pulseSpeakingState()
        if (lastInteractionAtRef.current > 0) {
          void pollLatestAudio(lastInteractionAtRef.current)
        }
      }
    }
  })

  const connectWebSocket = useEvent(() => {
    const existingSocket = websocketRef.current
    if (existingSocket && (existingSocket.readyState === WebSocket.OPEN || existingSocket.readyState === WebSocket.CONNECTING)) {
      return
    }

    setStageStatus((prev) => (prev === 'offline' ? 'connecting' : prev))
    const socket = new WebSocket(getWsUrl())
    websocketRef.current = socket

    socket.onopen = () => {
      setStageStatus(liveState === 1 ? 'idle' : 'connecting')
      setPanelMessage(liveState === 1 ? '已连接面板服务' : '面板已连接，等待直播启动')
      socket.send(JSON.stringify({ Username: DEFAULT_USER }))
      void fetchMessageHistory()
    }

    socket.onmessage = (event) => {
      try {
        handleIncomingMessage(JSON.parse(event.data) as WsPayload)
      } catch {
        // Ignore malformed frames and keep the connection alive.
      }
    }

    socket.onclose = () => {
      websocketRef.current = null
      stopAudioPulse()
      setStageStatus((prev) => (liveState === 1 ? 'connecting' : prev === 'offline' ? 'offline' : 'connecting'))
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current)
      }
      reconnectTimerRef.current = setTimeout(() => {
        connectWebSocket()
      }, 3000)
    }

    socket.onerror = () => {
      socket.close()
    }
  })

  const postJson = useEvent(async (path: string, body?: Record<string, unknown>) => {
    const response = await fetch(`${getApiBaseUrl()}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    })
    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`)
    }
    return response
  })

  const submitInteractionText = useEvent(async (rawText: string) => {
    const text = rawText.trim()
    if (!text || isSending) {
      return
    }
    if (liveState !== 1) {
      setPanelMessage('请先启动直播服务')
      return
    }

    setIsSending(true)
    lastInteractionAtRef.current = Date.now()
    setPanelMessage('消息已提交，等待 Fay 响应...')

    try {
      await postJson('/api/chat', {
        user: DEFAULT_USER,
        text,
      })
      setInputMessage('')
    } catch {
      appendChatMessage(createMessage('系统通知', '消息发送失败，请检查后端服务。', 'system'))
      setPanelMessage('消息发送失败')
    } finally {
      setIsSending(false)
    }
  })

  const transcribeRecordedAudio = useEvent(async (audioBlob: Blob) => {
    setIsTranscribing(true)
    setPanelMessage('正在进行 ASR 转写...')

    const formData = new FormData()
    formData.append('file', audioBlob, 'live-recording.webm')

    try {
      const response = await fetch(`${getApiBaseUrl()}/api/asr`, {
        method: 'POST',
        body: formData,
      })
      const payload = (await response.json()) as { text?: string; detail?: string; error?: string }
      if (!response.ok) {
        throw new Error(payload.detail || payload.error || 'ASR failed')
      }

      const transcript = (payload.text || '').trim()
      if (!transcript) {
        setPanelMessage('未识别到有效语音')
        enterIdleState()
        return
      }

      setInputMessage(transcript)
      await submitInteractionText(transcript)
    } catch {
      setPanelMessage('ASR 失败，请稍后再试')
      enterIdleState()
    } finally {
      setIsTranscribing(false)
    }
  })

  const handleStartLive = useEvent(async () => {
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
    setPanelMessage('正在停止直播服务...')
    try {
      await postJson('/api/stop-live')
      setLiveState(0)
      setStageStatus('offline')
      setNeonState('idle')
      stopAudioPulse()
      stopNativeAudio()
      releaseMicrophone()
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

    if (liveState !== 1) {
      setPanelMessage('请先启动直播服务')
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

        const scaleX = (containerWidth * 0.9) / model.width
        const scaleY = (containerHeight * 0.95) / model.height
        const baseScale = Math.min(scaleX, scaleY)
        const scale = baseScale * 1.3

        model.scale.set(scale, scale)
        model.anchor.set(0.5, 0.5)
        model.position.set(containerWidth * 0.42, containerHeight * 0.65)

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
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current)
      }
      if (speakingTimerRef.current) {
        clearTimeout(speakingTimerRef.current)
      }
      if (websocketRef.current) {
        websocketRef.current.close()
      }
      stopNativeAudio()
      releaseMicrophone()
      stopAudioPulse()
    }
  }, [connectWebSocket, fetchRuntimeStatus, releaseMicrophone, stopAudioPulse, stopNativeAudio])

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
              <div className="host-name">Fay Live2D Host</div>
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
                <span className="brand-text">Fay Runtime</span>
              </div>
              <div className="product-corner">
                <div className="corner-item">
                  <span className="corner-icon">WS</span>
                  <span className="corner-text">{isHumanConnected ? '数字人已连接' : '数字人未连接'}</span>
                </div>
              </div>
            </div>

            <PendulumClock />

            <div className="neon-control-panel">
              <div className="neon-control-title">Live Runtime</div>
              <div className="live-runtime-grid">
                <span className="runtime-chip">服务: {liveState === 1 ? '运行中' : '未启动'}</span>
                <span className="runtime-chip">用户: {DEFAULT_USER}</span>
                <span className="runtime-chip">远端音频: {remoteAudioConnected ? '已连接' : '未连接'}</span>
                <span className="runtime-chip">麦克风: {isRecording ? '录音中' : isTranscribing ? '转写中' : '待命'}</span>
                <span className="runtime-chip">音频播放: {isPlayingAudio ? '播放中' : '空闲'}</span>
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
              <div className="chat-list">
                {chatMessages.map((msg, index) => (
                  <div key={`${msg.user}-${index}-${msg.message}`} className="chat-item" style={{ animationDelay: `${index * 0.03}s` }}>
                    <div className="chat-header">
                      <span className="user-level" style={{ backgroundColor: msg.color }}>
                        {msg.level}
                      </span>
                      <span className="chat-user">{msg.user}</span>
                    </div>
                    <span className="chat-message">{msg.message}</span>
                  </div>
                ))}
              </div>
              <div className="input-bar">
                <input
                  type="text"
                  placeholder={liveState === 1 ? '输入文本，走现有 Fay NLP 链路...' : '请先启动直播服务'}
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
                    当前页面通过现有 Fay 后端链路触发文本互动，并消费 WebSocket 回推结果。
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
                    面板: {stageStatus === 'offline' ? '未连接' : '已连接'} / 数字人: {isHumanConnected ? '已连接' : '未连接'}
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
                    麦克风录音走 5000 主服务的 ASR 代理，回复音频通过原生 Audio 播放。
                  </div>
                  <button className="buy-btn" onClick={stopNativeAudio}>
                    停止播放
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
