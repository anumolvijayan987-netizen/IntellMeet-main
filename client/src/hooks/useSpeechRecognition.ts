import { useEffect, useRef, useState, useCallback } from 'react'
import { useMeetingStore } from '../stores/meetingStore'
import { useAuthStore } from '../stores/authStore'
import { useSocket } from './useSocket'

// Extend window interface for browser SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition?: any
    webkitSpeechRecognition?: any
  }
}

export const useSpeechRecognition = (roomId: string) => {
  const recognitionRef = useRef<any>(null)
  const [isSupported, setIsSupported] = useState(true)
  const isTranscribing = useMeetingStore((s) => s.isTranscribing)
  const isMicOn = useMeetingStore((s) => s.isMicOn)
  const setLiveSubtitle = useMeetingStore((s) => s.setLiveSubtitle)
  const addTranscript = useMeetingStore((s) => s.addTranscript)
  const userName = useAuthStore((s) => s.user.name)
  const { socket } = useSocket()

  const startRecognition = useCallback(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition

    if (!SpeechRecognition) {
      setIsSupported(false)
      return
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch {
        // Ignore error
      }
    }

    try {
      const recognition = new SpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'en-US'

      recognition.onresult = (event: any) => {
        let interimText = ''
        let finalText = ''

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalText += event.results[i][0].transcript
          } else {
            interimText += event.results[i][0].transcript
          }
        }

        const displayText = interimText || finalText
        if (displayText.trim()) {
          setLiveSubtitle(displayText, userName)

          // Broadcast live subtitle chunk via Socket.io
          if (socket && roomId) {
            socket.emit('transcript-chunk', {
              roomId,
              transcriptData: {
                speaker: userName,
                text: displayText,
              },
            })
          }
        }

        if (finalText.trim()) {
          const entry = {
            speaker: userName,
            text: finalText.trim(),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }
          addTranscript(entry)
        }
      }

      recognition.onerror = () => {
        // Gracefully ignore speech recognition hardware errors or silence timeouts
      }

      recognition.onend = () => {
        // Auto-restart if transcription and mic remain active
        if (isTranscribing && isMicOn) {
          try {
            recognition.start()
          } catch {
            // Ignore restart collisions
          }
        }
      }

      recognition.start()
      recognitionRef.current = recognition
    } catch {
      // Speech recognition initialization fallback
    }
  }, [roomId, userName, isTranscribing, isMicOn, socket, setLiveSubtitle, addTranscript])

  const stopRecognition = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
        recognitionRef.current = null
      } catch {
        // Ignore
      }
    }
    setLiveSubtitle('', '')
  }, [setLiveSubtitle])

  useEffect(() => {
    if (isTranscribing && isMicOn && roomId) {
      startRecognition()
    } else {
      stopRecognition()
    }

    return () => {
      stopRecognition()
    }
  }, [isTranscribing, isMicOn, roomId, startRecognition, stopRecognition])

  return { isSupported }
}
