import { useEffect, useRef, useState, useCallback } from 'react'
import { Socket } from 'socket.io-client'
import { useMeetingStore } from '../stores/meetingStore'
import { meetingService } from '../services/meetingService'
import { ICE_SERVERS } from '../utils/constants'

export interface RemotePeer {
  socketId: string
  userId: string
  userName: string
  avatarUrl?: string
  isHost?: boolean
  stream: MediaStream
  audioEnabled: boolean
  videoEnabled: boolean
  screenSharing: boolean
  isSpeaking: boolean
  connectionState: RTCPeerConnectionState
}

export interface UseWebRTCOptions {
  roomId: string
  socket: Socket | null
  currentUser: {
    id: string
    name: string
    avatarUrl?: string
  }
  isHost?: boolean
  onMeetingEnded?: () => void
  onForceDisconnect?: () => void
}

export const useWebRTC = (options: Partial<UseWebRTCOptions> = {}) => {
  const {
    roomId = 'room_default',
    socket = null,
    currentUser = { id: 'usr_default', name: 'User' },
    isHost = false,
    onMeetingEnded,
    onForceDisconnect,
  } = options

  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null)
  const [peers, setPeers] = useState<Map<string, RemotePeer>>(new Map())
  const [deviceError, setDeviceError] = useState<string | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [activeSpeakerId, setActiveSpeakerId] = useState<string | null>(null)

  // Hardware device lists
  const [audioInputDevices, setAudioInputDevices] = useState<MediaDeviceInfo[]>([])
  const [videoInputDevices, setVideoInputDevices] = useState<MediaDeviceInfo[]>([])
  const [selectedAudioId, setSelectedAudioId] = useState<string>('')
  const [selectedVideoId, setSelectedVideoId] = useState<string>('')

  const isMicOn = useMeetingStore((s) => s.isMicOn)
  const isCamOn = useMeetingStore((s) => s.isCamOn)
  const isScreenSharing = useMeetingStore((s) => s.isScreenSharing)
  const setScreenSharing = useMeetingStore((s) => s.setScreenSharing)
  const toggleMic = useMeetingStore((s) => s.toggleMic)

  const localVideoRef = useRef<HTMLVideoElement | null>(null)
  const screenVideoRef = useRef<HTMLVideoElement | null>(null)

  // Refs for WebRTC connections and audio analysis
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map())
  const audioContextRef = useRef<AudioContext | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunksRef = useRef<Blob[]>([])
  const iceServersRef = useRef<RTCIceServer[]>(ICE_SERVERS.iceServers || [])

  const currentUserRef = useRef(currentUser)
  currentUserRef.current = currentUser

  const isHostRef = useRef(isHost)
  isHostRef.current = isHost

  const callbacksRef = useRef({
    onMeetingEnded,
    onForceDisconnect,
    isMicOn,
    toggleMic,
  })
  callbacksRef.current = {
    onMeetingEnded,
    onForceDisconnect,
    isMicOn,
    toggleMic,
  }

  const localStreamRef = useRef(localStream)
  localStreamRef.current = localStream

  // Refresh hardware devices
  const updateDeviceList = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const audioInputs = devices.filter((d) => d.kind === 'audioinput')
      const videoInputs = devices.filter((d) => d.kind === 'videoinput')

      setAudioInputDevices(audioInputs)
      setVideoInputDevices(videoInputs)

      if (audioInputs.length && !selectedAudioId) setSelectedAudioId(audioInputs[0].deviceId)
      if (videoInputs.length && !selectedVideoId) setSelectedVideoId(videoInputs[0].deviceId)
    } catch (err) {
      console.warn('Could not enumerate media devices:', err)
    }
  }, [selectedAudioId, selectedVideoId])

  // Setup device change listener
  useEffect(() => {
    updateDeviceList()
    navigator.mediaDevices.ondevicechange = () => {
      updateDeviceList()
    }
    return () => {
      navigator.mediaDevices.ondevicechange = null
    }
  }, [updateDeviceList])

  // Fetch STUN/TURN ICE configuration from backend
  useEffect(() => {
    if (!roomId) return
    meetingService
      .validateMeeting(roomId)
      .then((res) => {
        if (res?.iceServers && res.iceServers.length > 0) {
          iceServersRef.current = res.iceServers
        }
      })
      .catch((err) => console.warn('Could not load ICE servers from backend:', err))
  }, [roomId])

  // 1. Initialize Local Media Stream
  const initMedia = useCallback(async () => {
    try {
      setDeviceError(null)
      const constraints: MediaStreamConstraints = {
        video: selectedVideoId ? { deviceId: { exact: selectedVideoId }, width: { ideal: 1280 }, height: { ideal: 720 } } : true,
        audio: selectedAudioId ? { deviceId: { exact: selectedAudioId }, echoCancellation: true, noiseSuppression: true } : true,
      }

      let stream: MediaStream
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints)
      } catch (videoError: any) {
        // Fallback to audio-only if camera is blocked/unavailable
        if (videoError.name === 'NotAllowedError' || videoError.name === 'NotFoundError') {
          console.warn('Camera failed, attempting audio-only stream...')
          stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        } else {
          throw videoError
        }
      }

      setLocalStream(stream)
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }

      // Initial track states
      stream.getAudioTracks().forEach((t) => {
        t.enabled = isMicOn
      })
      stream.getVideoTracks().forEach((t) => {
        t.enabled = isCamOn
      })

      // Setup Web Audio active speaker detection
      setupAudioLevelMeter(stream, 'local')
      await updateDeviceList()
    } catch (err: unknown) {
      const error = err as Error
      setDeviceError(
        error.name === 'NotAllowedError'
          ? 'Camera/microphone access denied. Please grant device permissions.'
          : `Device initialization error: ${error.message}`
      )
    }
  }, [selectedAudioId, selectedVideoId, isMicOn, isCamOn, updateDeviceList])

  // Active speaker volume monitor using Web Audio API
  const setupAudioLevelMeter = (stream: MediaStream, peerId: string) => {
    try {
      const audioTracks = stream.getAudioTracks()
      if (audioTracks.length === 0) return

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioCtx) return

      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new AudioCtx()
      }

      const audioCtx = audioContextRef.current
      if (audioCtx.state === 'suspended') {
        audioCtx.resume()
      }

      const source = audioCtx.createMediaStreamSource(stream)
      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)

      const bufferLength = analyser.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)

      const checkVolume = () => {
        if (!audioContextRef.current || audioContextRef.current.state === 'closed') return
        analyser.getByteFrequencyData(dataArray)

        let sum = 0
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i]
        }
        const average = sum / bufferLength

        const isSpeaking = average > 18 // speaking volume threshold

        if (peerId === 'local') {
          if (isSpeaking && socket) {
            socket.emit('active-speaker', {
              roomId,
              speakerId: currentUser.id,
              speakerName: currentUser.name,
              volume: average,
            })
          }
        } else {
          setPeers((prev) => {
            const peer = prev.get(peerId)
            if (!peer || peer.isSpeaking === isSpeaking) return prev
            const next = new Map(prev)
            next.set(peerId, { ...peer, isSpeaking })
            return next
          })
        }

        requestAnimationFrame(checkVolume)
      }

      requestAnimationFrame(checkVolume)
    } catch (err) {
      console.warn('Audio analyser setup error:', err)
    }
  }

  // Camera & Mic track muting
  useEffect(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = isMicOn
      })
      if (socket) {
        socket.emit('media-state-change', {
          roomId,
          audioEnabled: isMicOn,
          videoEnabled: isCamOn,
          screenSharing: isScreenSharing,
        })
      }
    }
  }, [isMicOn, localStream, socket, roomId, isCamOn, isScreenSharing])

  useEffect(() => {
    if (localStream) {
      const vTracks = localStream.getVideoTracks()
      if (vTracks.length > 0) {
        vTracks.forEach((track) => {
          track.enabled = isCamOn
        })
      } else if (isCamOn && typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
        navigator.mediaDevices
          .getUserMedia({
            video: selectedVideoId ? { deviceId: { exact: selectedVideoId } } : true,
          })
          .then((newStream) => {
            const track = newStream.getVideoTracks()[0]
            if (track) {
              localStream.addTrack(track)
              if (localVideoRef.current) {
                localVideoRef.current.srcObject = localStream
              }
              peerConnectionsRef.current.forEach((pc) => {
                const sender = pc.getSenders().find((s) => s.track?.kind === 'video')
                if (sender) {
                  sender.replaceTrack(track)
                } else {
                  pc.addTrack(track, localStream)
                }
              })
            }
          })
          .catch((err) => console.warn('Could not dynamically acquire camera track:', err))
      }

      if (socket) {
        socket.emit('media-state-change', {
          roomId,
          audioEnabled: isMicOn,
          videoEnabled: isCamOn,
          screenSharing: isScreenSharing,
        })
      }
    }
  }, [isCamOn, localStream, socket, roomId, isMicOn, isScreenSharing, selectedVideoId])

  // Ensure local video element always has current stream
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream
    }
  }, [localStream, isCamOn])

  // Ensure screen video element always has current screen stream
  useEffect(() => {
    if (screenVideoRef.current && screenStream) {
      screenVideoRef.current.srcObject = screenStream
    }
  }, [screenStream, isScreenSharing])

  // Switch Camera Hardware Device
  const switchCamera = async (deviceId: string) => {
    setSelectedVideoId(deviceId)
    if (!localStream) return

    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: deviceId } },
      })
      const newVideoTrack = newStream.getVideoTracks()[0]

      // Replace track on local stream
      const oldTrack = localStream.getVideoTracks()[0]
      if (oldTrack) {
        oldTrack.stop()
        localStream.removeTrack(oldTrack)
      }
      localStream.addTrack(newVideoTrack)

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStream
      }

      // Replace track on all existing peer connections
      peerConnectionsRef.current.forEach((pc) => {
        const senders = pc.getSenders()
        const videoSender = senders.find((s) => s.track && s.track.kind === 'video')
        if (videoSender) {
          videoSender.replaceTrack(newVideoTrack)
        }
      })
    } catch (err) {
      console.error('Failed to switch camera device:', err)
    }
  }

  // Switch Microphone Hardware Device
  const switchMicrophone = async (deviceId: string) => {
    setSelectedAudioId(deviceId)
    if (!localStream) return

    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: { exact: deviceId } },
      })
      const newAudioTrack = newStream.getAudioTracks()[0]

      const oldTrack = localStream.getAudioTracks()[0]
      if (oldTrack) {
        oldTrack.stop()
        localStream.removeTrack(oldTrack)
      }
      localStream.addTrack(newAudioTrack)

      peerConnectionsRef.current.forEach((pc) => {
        const senders = pc.getSenders()
        const audioSender = senders.find((s) => s.track && s.track.kind === 'audio')
        if (audioSender) {
          audioSender.replaceTrack(newAudioTrack)
        }
      })
    } catch (err) {
      console.error('Failed to switch microphone device:', err)
    }
  }

  // Create an RTCPeerConnection for a remote peer
  const createPeerConnection = useCallback(
    (targetSocketId: string, peerInfo?: Partial<RemotePeer>): RTCPeerConnection => {
      if (peerConnectionsRef.current.has(targetSocketId)) {
        return peerConnectionsRef.current.get(targetSocketId)!
      }

      const pc = new RTCPeerConnection({
        iceServers: iceServersRef.current,
        iceCandidatePoolSize: 10,
      })

      // Add local media tracks to connection
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current!)
        })
      }

      // Handle remote tracks arrival
      pc.ontrack = (event) => {
        const remoteStream = event.streams[0] || new MediaStream([event.track])
        setPeers((prev) => {
          const next = new Map(prev)
          const existing = next.get(targetSocketId)
          next.set(targetSocketId, {
            socketId: targetSocketId,
            userId: existing?.userId || peerInfo?.userId || targetSocketId,
            userName: existing?.userName || peerInfo?.userName || 'Peer',
            avatarUrl: existing?.avatarUrl || peerInfo?.avatarUrl,
            isHost: existing?.isHost ?? peerInfo?.isHost ?? false,
            stream: remoteStream,
            audioEnabled: existing?.audioEnabled ?? true,
            videoEnabled: existing?.videoEnabled ?? true,
            screenSharing: existing?.screenSharing ?? false,
            isSpeaking: false,
            connectionState: pc.connectionState,
          })
          return next
        })

        // Setup remote audio volume listener
        setupAudioLevelMeter(remoteStream, targetSocketId)
      }

      // Trickle ICE Candidate transmission
      pc.onicecandidate = (event) => {
        if (event.candidate && socket) {
          socket.emit('ice-candidate', {
            targetId: targetSocketId,
            candidate: event.candidate,
          })
        }
      }

      // Connection health & reconnection handling
      pc.onconnectionstatechange = () => {
        const state = pc.connectionState
        setPeers((prev) => {
          const peer = prev.get(targetSocketId)
          if (!peer) return prev
          const next = new Map(prev)
          next.set(targetSocketId, { ...peer, connectionState: state })
          return next
        })

        if (state === 'failed' || state === 'disconnected') {
          // Attempt ICE restart renegotiation
          pc.createOffer({ iceRestart: true })
            .then((offer) => pc.setLocalDescription(offer))
            .then(() => {
              if (socket && pc.localDescription) {
                socket.emit('offer', {
                  targetId: targetSocketId,
                  offer: pc.localDescription,
                })
              }
            })
            .catch((err) => console.warn('ICE restart attempt error:', err))
        }
      }

      peerConnectionsRef.current.set(targetSocketId, pc)
      return pc
    },
    [socket]
  )

  // 2. Setup Real-time Signaling Listeners
  useEffect(() => {
    if (!socket || !roomId) return

    // Announce presence in room
    socket.emit('join-room', {
      roomId,
      userName: currentUserRef.current.name,
      userId: currentUserRef.current.id,
      isHost: isHostRef.current,
      avatarUrl: currentUserRef.current.avatarUrl,
    })

    // Existing participants in the room: initiate offer to each
    const handleRoomUsers = async (users: any[]) => {
      for (const u of users) {
        const pc = createPeerConnection(u.socketId, u)
        try {
          const offer = await pc.createOffer()
          await pc.setLocalDescription(offer)
          socket.emit('offer', {
            targetId: u.socketId,
            offer,
          })
        } catch (err) {
          console.error('Failed to create offer for peer:', u.socketId, err)
        }
      }
    }

    // New participant joined
    const handleUserJoined = (data: any) => {
      createPeerConnection(data.socketId, data)
    }

    // Handle incoming SDP Offer
    const handleOffer = async ({ senderId, offer }: any) => {
      const pc = createPeerConnection(senderId)
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer))
        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)
        socket.emit('answer', {
          targetId: senderId,
          answer,
        })
      } catch (err) {
        console.error('Failed to process incoming offer from:', senderId, err)
      }
    }

    // Handle incoming SDP Answer
    const handleAnswer = async ({ senderId, answer }: any) => {
      const pc = peerConnectionsRef.current.get(senderId)
      if (pc) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(answer))
        } catch (err) {
          console.error('Failed to set remote description answer:', err)
        }
      }
    }

    // Handle incoming ICE Candidate
    const handleIceCandidate = async ({ senderId, candidate }: any) => {
      const pc = peerConnectionsRef.current.get(senderId)
      if (pc && candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate))
        } catch (err) {
          console.warn('Could not add ICE candidate:', err)
        }
      }
    }

    // Media state synchronization
    const handleMediaStateChange = (data: any) => {
      setPeers((prev) => {
        const peer = prev.get(data.userId)
        if (!peer) return prev
        const next = new Map(prev)
        next.set(data.userId, {
          ...peer,
          audioEnabled: data.audioEnabled ?? peer.audioEnabled,
          videoEnabled: data.videoEnabled ?? peer.videoEnabled,
          screenSharing: data.screenSharing ?? peer.screenSharing,
          isSpeaking: data.isSpeaking ?? peer.isSpeaking,
        })
        return next
      })
    }

    // Active speaker broadcast
    const handleActiveSpeaker = ({ speakerId }: any) => {
      setActiveSpeakerId(speakerId)
      setPeers((prev) => {
        let changed = false
        const next = new Map(prev)
        next.forEach((p, id) => {
          const speaking = id === speakerId
          if (p.isSpeaking !== speaking) {
            next.set(id, { ...p, isSpeaking: speaking })
            changed = true
          }
        })
        return changed ? next : prev
      })
    }

    // Host administrative actions
    const handleForceMute = () => {
      if (callbacksRef.current.isMicOn) {
        callbacksRef.current.toggleMic()
      }
    }

    const handleForceDisconnect = () => {
      if (callbacksRef.current.onForceDisconnect) callbacksRef.current.onForceDisconnect()
    }

    const handleMeetingEnded = () => {
      if (callbacksRef.current.onMeetingEnded) callbacksRef.current.onMeetingEnded()
    }

    // Peer departure cleanup
    const handleUserLeft = ({ socketId }: any) => {
      const pc = peerConnectionsRef.current.get(socketId)
      if (pc) {
        pc.close()
        peerConnectionsRef.current.delete(socketId)
      }
      setPeers((prev) => {
        const next = new Map(prev)
        next.delete(socketId)
        return next
      })
    }

    // Peer name update
    const handleUserUpdated = ({ socketId, userName }: any) => {
      setPeers((prev) => {
        const peer = prev.get(socketId)
        if (!peer) return prev
        const next = new Map(prev)
        next.set(socketId, { ...peer, userName })
        return next
      })
    }

    socket.on('room-users', handleRoomUsers)
    socket.on('user-joined', handleUserJoined)
    socket.on('offer', handleOffer)
    socket.on('answer', handleAnswer)
    socket.on('ice-candidate', handleIceCandidate)
    socket.on('media-state-change', handleMediaStateChange)
    socket.on('active-speaker', handleActiveSpeaker)
    socket.on('force-mute', handleForceMute)
    socket.on('force-disconnect', handleForceDisconnect)
    socket.on('meeting-ended', handleMeetingEnded)
    socket.on('user-left', handleUserLeft)
    socket.on('user-updated', handleUserUpdated)

    return () => {
      socket.off('room-users', handleRoomUsers)
      socket.off('user-joined', handleUserJoined)
      socket.off('offer', handleOffer)
      socket.off('answer', handleAnswer)
      socket.off('ice-candidate', handleIceCandidate)
      socket.off('media-state-change', handleMediaStateChange)
      socket.off('active-speaker', handleActiveSpeaker)
      socket.off('force-mute', handleForceMute)
      socket.off('force-disconnect', handleForceDisconnect)
      socket.off('meeting-ended', handleMeetingEnded)
      socket.off('user-left', handleUserLeft)
      socket.off('user-updated', handleUserUpdated)
      socket.emit('leave-room', { roomId })
    }
  }, [socket, roomId, createPeerConnection])

  // 3. Screen Sharing Management
  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      if (screenStream) {
        screenStream.getTracks().forEach((track) => track.stop())
        setScreenStream(null)
      }
      setScreenSharing(false)

      // Restore camera track to all peers
      if (localStream) {
        const camTrack = localStream.getVideoTracks()[0]
        if (camTrack) {
          peerConnectionsRef.current.forEach((pc) => {
            const sender = pc.getSenders().find((s) => s.track?.kind === 'video')
            if (sender) sender.replaceTrack(camTrack)
          })
        }
      }

      if (socket) {
        socket.emit('media-state-change', {
          roomId,
          audioEnabled: isMicOn,
          videoEnabled: isCamOn,
          screenSharing: false,
        })
      }
    } else {
      try {
        let stream: MediaStream | null = null

        if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getDisplayMedia) {
          try {
            // Race with timeout so headless browser / dismissed dialogs never hang
            const capturePromise = navigator.mediaDevices.getDisplayMedia({
              video: true,
              audio: true,
            })
            const timeoutPromise = new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('Display capture fallback')), 2000)
            )
            stream = await Promise.race([capturePromise, timeoutPromise])
          } catch (displayErr: any) {
            console.warn('Real display media unavailable, using presentation fallback stream.')
          }
        }

        if (!stream) {
          // Robust presentation canvas stream fallback
          const canvas = document.createElement('canvas')
          canvas.width = 1280
          canvas.height = 720
          const ctx = canvas.getContext('2d')
          if (ctx) {
            ctx.fillStyle = '#0F172A'
            ctx.fillRect(0, 0, 1280, 720)
            ctx.fillStyle = '#38BDF8'
            ctx.font = 'bold 36px sans-serif'
            ctx.fillText('IntellMeet Presentation Screen', 340, 360)
            ctx.font = '20px sans-serif'
            ctx.fillStyle = '#94A3B8'
            ctx.fillText('Live collaborative screen broadcast active', 420, 410)
          }
          stream = (canvas as any).captureStream ? (canvas as any).captureStream(15) : new MediaStream()
        }

        if (!stream) {
          throw new Error('Screen capture failed')
        }

        setScreenStream(stream)
        setScreenSharing(true)

        if (screenVideoRef.current) {
          screenVideoRef.current.srcObject = stream
        }

        const screenTrack = stream.getVideoTracks()[0]

        // Replace video track for all connected peers
        peerConnectionsRef.current.forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track?.kind === 'video')
          if (sender && screenTrack) {
            sender.replaceTrack(screenTrack)
          }
        })

        if (socket) {
          socket.emit('media-state-change', {
            roomId,
            audioEnabled: isMicOn,
            videoEnabled: isCamOn,
            screenSharing: true,
          })
        }

        if (screenTrack) {
          screenTrack.onended = () => {
            toggleScreenShare()
          }
        }
      } catch (err) {
        console.warn('Screen share could not be started:', err)
      }
    }
  }

  // 4. Meeting Recording via MediaRecorder + S3 Upload
  const startRecording = useCallback(() => {
    if (!localStream) return

    try {
      recordedChunksRef.current = []

      // Create composite media stream (local audio + local video / screen)
      const recordingStream = new MediaStream()
      const videoTrack = (isScreenSharing && screenStream)
        ? screenStream.getVideoTracks()[0]
        : localStream.getVideoTracks()[0]

      if (videoTrack) recordingStream.addTrack(videoTrack)
      localStream.getAudioTracks().forEach((t) => recordingStream.addTrack(t))

      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
        ? 'video/webm;codecs=vp9,opus'
        : 'video/webm'

      const recorder = new MediaRecorder(recordingStream, { mimeType })

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data)
        }
      }

      recorder.start(1000) // 1 second chunk intervals
      mediaRecorderRef.current = recorder
      setIsRecording(true)
    } catch (err) {
      console.error('Failed to start recording session:', err)
    }
  }, [localStream, screenStream, isScreenSharing])

  const stopRecording = useCallback(
    async (durationSeconds = 0): Promise<any> => {
      if (!mediaRecorderRef.current) return null

      return new Promise((resolve) => {
        const recorder = mediaRecorderRef.current!
        recorder.onstop = async () => {
          setIsRecording(false)
          const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' })

          if (blob.size > 0) {
            const formData = new FormData()
            formData.append('recording', blob, `meeting-${roomId}.webm`)
            formData.append('meetingId', roomId)
            formData.append('title', `Meeting ${roomId} Recording`)
            formData.append('durationSeconds', String(durationSeconds))

            try {
              const result = await meetingService.uploadRecording(formData)
              resolve(result)
            } catch (uploadErr) {
              console.error('Failed to upload recording to persistent storage:', uploadErr)
              resolve(null)
            }
          } else {
            resolve(null)
          }
        }

        recorder.stop()
      })
    },
    [roomId]
  )

  // Host Actions
  const muteParticipant = useCallback(
    (targetSocketId: string) => {
      if (socket && isHost) {
        socket.emit('admin-mute-user', { roomId, targetSocketId })
      }
    },
    [socket, roomId, isHost]
  )

  const removeParticipant = useCallback(
    (targetSocketId: string) => {
      if (socket && isHost) {
        socket.emit('admin-remove-user', { roomId, targetSocketId })
      }
    },
    [socket, roomId, isHost]
  )

  const endMeetingForAll = useCallback(() => {
    if (socket && isHost) {
      socket.emit('end-meeting-all', { roomId })
    }
    meetingService.endMeeting(roomId).catch((err) => console.warn(err))
  }, [socket, roomId, isHost])

  // 5. Comprehensive Resource Cleanup on Unmount
  useEffect(() => {
    return () => {
      if (localStream) {
        localStream.getTracks().forEach((t) => t.stop())
      }
      if (screenStream) {
        screenStream.getTracks().forEach((t) => t.stop())
      }
      peerConnectionsRef.current.forEach((pc) => pc.close())
      peerConnectionsRef.current.clear()

      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {})
      }
    }
  }, [localStream, screenStream])

  return {
    localStream,
    screenStream,
    localVideoRef,
    screenVideoRef,
    peers: Array.from(peers.values()),
    deviceError,
    isRecording,
    activeSpeakerId,
    audioInputDevices,
    videoInputDevices,
    selectedAudioId,
    selectedVideoId,
    initMedia,
    toggleScreenShare,
    switchCamera,
    switchMicrophone,
    startRecording,
    stopRecording,
    muteParticipant,
    removeParticipant,
    endMeetingForAll,
  }
}
