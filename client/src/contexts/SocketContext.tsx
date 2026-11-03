import React, { createContext, useEffect, useState } from 'react'
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
  const [socket, setSocket] = useState<Socket | null>(null)

  useEffect(() => {
    const socketInstance = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    setSocket(socketInstance)

    socketInstance.on('connect', () => {
      setIsConnected(true)
    })

    socketInstance.on('disconnect', () => {
      setIsConnected(false)
    })

    return () => {
      socketInstance.disconnect()
      setSocket(null)
      setIsConnected(false)
    }
  }, [])

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  )
}
