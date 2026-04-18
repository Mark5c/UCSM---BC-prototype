import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import type { ConnectionStatus, WSEvent } from '../types'
import { generateClientId } from '../utils/format'

interface WebSocketContextValue {
  status: ConnectionStatus
  lastEvent: WSEvent | null
  clientId: string
}

const WebSocketContext = createContext<WebSocketContextValue>({
  status: 'disconnected',
  lastEvent: null,
  clientId: '',
})

const DEFAULT_CLIENT_ID = generateClientId()

export function WebSocketProvider({
  children,
  projectId,
  onEvent,
  clientId: propClientId,
}: {
  children: React.ReactNode
  projectId: string | null
  onEvent?: (event: WSEvent) => void
  clientId?: string
}) {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected')
  const [lastEvent, setLastEvent] = useState<WSEvent | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const retryDelayRef = useRef(500)
  const mountedRef = useRef(true)

  const connect = useCallback(() => {
    if (!projectId || !mountedRef.current) return

    setStatus('connecting')
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
    const host = window.location.host
    const clientId = propClientId || DEFAULT_CLIENT_ID
    const token = localStorage.getItem('ucms_token') ?? ''
    const url = `${protocol}://${host}/ws/${projectId}?client_id=${clientId}&token=${token}`

    const ws = new WebSocket(url)
    wsRef.current = ws

    ws.onopen = () => {
      if (!mountedRef.current) return
      setStatus('connected')
      retryDelayRef.current = 500
    }

    ws.onmessage = (e) => {
      if (!mountedRef.current) return
      try {
        const event: WSEvent = JSON.parse(e.data)
        setLastEvent(event)
        onEvent?.(event)
      } catch {
        // ignore malformed messages
      }
    }

    ws.onclose = () => {
      if (!mountedRef.current) return
      setStatus('disconnected')
      wsRef.current = null
      // Reconnect with exponential backoff
      const delay = Math.min(retryDelayRef.current, 8000)
      retryDelayRef.current = delay * 2
      retryRef.current = setTimeout(connect, delay)
    }

    ws.onerror = () => {
      ws.close()
    }
  }, [projectId, onEvent])

  useEffect(() => {
    mountedRef.current = true

    if (projectId) {
      connect()
    }

    return () => {
      mountedRef.current = false
      if (retryRef.current) clearTimeout(retryRef.current)
      if (wsRef.current) {
        wsRef.current.onclose = null
        wsRef.current.close()
      }
    }
  }, [projectId, connect])

  const clientId = propClientId || DEFAULT_CLIENT_ID
  return (
    <WebSocketContext.Provider value={{ status, lastEvent, clientId }}>
      {children}
    </WebSocketContext.Provider>
  )
}

export function useWebSocket() {
  return useContext(WebSocketContext)
}
