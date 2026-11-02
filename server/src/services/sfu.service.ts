import { AccessToken } from 'livekit-server-sdk'
import { env } from '../config/env'
import { logger } from '../utils/logger'

export interface SfuCredentials {
  provider: 'livekit' | 'webrtc_mesh'
  livekitUrl: string
  token: string
  iceServers: RTCIceServer[]
  roomId: string
  identity: string
  isHost: boolean
}

export class SfuService {
  /**
   * Generates a signed LiveKit SFU access token and ICE server configuration
   */
  public static async generateToken(params: {
    roomId: string
    identity: string
    name: string
    isHost?: boolean
  }): Promise<SfuCredentials> {
    const { roomId, identity, name, isHost = false } = params

    // 1. Generate LiveKit Access Token
    const at = new AccessToken(env.LIVEKIT_API_KEY, env.LIVEKIT_API_SECRET, {
      identity,
      name,
      ttl: '4h',
    })

    at.addGrant({
      roomJoin: true,
      room: roomId,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
      roomAdmin: isHost,
      roomRecord: isHost,
    })

    const token = await at.toJwt()

    // 2. Assemble STUN/TURN ICE Servers
    const iceServers: RTCIceServer[] = env.STUN_SERVERS.split(',')
      .map((url) => url.trim())
      .filter(Boolean)
      .map((url) => ({ urls: url }))

    if (env.TURN_SERVERS) {
      const turnUrls = env.TURN_SERVERS.split(',').map((u) => u.trim()).filter(Boolean)
      const turnConfig: RTCIceServer = {
        urls: turnUrls,
      }
      if (env.TURN_USERNAME) turnConfig.username = env.TURN_USERNAME
      if (env.TURN_CREDENTIAL) turnConfig.credential = env.TURN_CREDENTIAL
      iceServers.push(turnConfig)
    }

    logger.info(`🔑 Generated SFU token for ${identity} (${name}) in room: ${roomId} [Host: ${isHost}]`)

    return {
      provider: 'livekit',
      livekitUrl: env.LIVEKIT_URL,
      token,
      iceServers,
      roomId,
      identity,
      isHost,
    }
  }

  /**
   * Get raw ICE servers list for standard WebRTC mesh
   */
  public static getIceServers(): RTCIceServer[] {
    const iceServers: RTCIceServer[] = env.STUN_SERVERS.split(',')
      .map((url) => url.trim())
      .filter(Boolean)
      .map((url) => ({ urls: url }))

    if (env.TURN_SERVERS) {
      const turnConfig: RTCIceServer = {
        urls: env.TURN_SERVERS.split(',').map((u) => u.trim()).filter(Boolean),
      }
      if (env.TURN_USERNAME) turnConfig.username = env.TURN_USERNAME
      if (env.TURN_CREDENTIAL) turnConfig.credential = env.TURN_CREDENTIAL
      iceServers.push(turnConfig)
    }

    return iceServers
  }
}
