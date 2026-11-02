import React, { createContext, useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { SOCKET_URL } from '../utils/constants'

interface SocketContextValue {
  socket: Socket | null
  isConnected: boolean
}

export const SocketContext = createContext<SocketContextValue>({
  socket: null,
  isConnected: false,
})

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false)
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    socketRef.current = socket

    socket.on('connect', () => {
      setIsConnected(true)
    })

    socket.on('disconnect', () => {
      setIsConnected(false)
    })

    return () => {
      socket.disconnect()
    }
  }, [])

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, isConnected }}>
      {children}
    </SocketContext.Provider>
  )
}
