# IntellMeet — REST API & Real-Time Socket Reference

**API Base URL (Production):** `https://api.intellmeet.yourdomain.com/api`  
**API Base URL (Local Dev):** `http://localhost:5000/api`  
**Authentication:** HTTP Bearer JWT header (`Authorization: Bearer <token>`) & HTTP-only cookies  
**Content-Type:** `application/json` (or `multipart/form-data` for media uploads)  

---

## 1. System & Health Endpoints

### `GET /health` or `GET /api/health`
Returns top-level server health and system metrics.

**Response `200 OK`:**
```json
{
  "success": true,
  "message": "IntellMeet service is healthy",
  "data": {
    "status": "healthy",
    "service": "IntellMeet Enterprise Real-time & Collaboration Platform",
    "version": "1.0.0",
    "uptimeSeconds": 1420,
    "timestamp": "2026-10-31T02:00:00.000Z",
    "database": {
      "status": "connected",
      "uriMasked": "mongodb+srv://***:***@cluster0.mongodb.net/intellimeet"
    },
    "socket": {
      "activeConnections": 12,
      "activeRooms": 3
    },
    "system": {
      "nodeVersion": "v20.18.0",
      "platform": "linux",
      "memoryUsageMB": {
        "rss": 112,
        "heapTotal": 64,
        "heapUsed": 48
      }
    }
  }
}
```

---

## 2. Authentication & Profile Endpoints

### `POST /api/auth/register`
Creates an enterprise account with a default organization.

**Request Body:**
```json
{
  "name": "Sarah Connor",
  "email": "sarah.connor@cyberdyne.io",
  "password": "SecurePassword123!",
  "organizationName": "Cyberdyne Systems"
}
```

**Response `201 Created`:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "usr_91238491",
      "name": "Sarah Connor",
      "email": "sarah.connor@cyberdyne.io",
      "role": "org_admin"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6..."
  }
}
```

### `POST /api/auth/login`
Authenticates credentials and sets an HTTP-only refresh token cookie.

**Request Body:**
```json
{
  "email": "sarah.connor@cyberdyne.io",
  "password": "SecurePassword123!"
}
```

### `GET /api/auth/me`
Fetches the currently authenticated user's profile.
*Requires Bearer Token.*

### `POST /api/auth/refresh`
Rotates the refresh token and issues a new access token.

### `POST /api/auth/logout`
Invalidates active session refresh tokens and clears cookies.

---

## 3. Meeting & Video Conference Endpoints

### `POST /api/meetings`
Schedules or creates an instant meeting room.

**Request Body:**
```json
{
  "title": "Sprint Architecture Review",
  "description": "Finalize Q4 microservices roadmap",
  "scheduledStartTime": "2026-11-01T15:00:00.000Z",
  "durationMinutes": 45,
  "timezone": "America/New_York",
  "attendees": ["david@cyberdyne.io", "elena@cyberdyne.io"]
}
```

**Response `201 Created`:**
```json
{
  "success": true,
  "data": {
    "meeting": {
      "id": "mtg_519a7e8b",
      "roomId": "meet-4a2b-9f1c",
      "title": "Sprint Architecture Review",
      "status": "scheduled",
      "inviteLink": "https://intellmeet.vercel.app/room/meet-4a2b-9f1c"
    }
  }
}
```

### `GET /api/meetings/validate/:roomId`
Validates meeting room status and issues STUN/TURN ICE configuration before joining.

### `GET /api/meetings/:id/token`
Generates signed LiveKit SFU access tokens with participant permissions.

---

## 4. Artificial Intelligence & Post-Meeting Intelligence

### `POST /api/ai/transcribe`
Uploads meeting audio for Whisper speech-to-text processing.
*Payload:* `multipart/form-data` with `file` (`.wav`, `.webm`, `.mp3`).

### `POST /api/ai/summarize`
Generates structured enterprise minutes from transcript chunks.

**Request Body:**
```json
{
  "roomName": "meet-4a2b-9f1c",
  "transcript": [
    { "speaker": "Sarah", "text": "We decided to migrate the frontend to Vercel." },
    { "speaker": "David", "text": "I will configure the production vercel.json rewrites by tomorrow." }
  ]
}
```

**Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "meetingOverview": "Architecture sync focusing on production Vercel edge deployment.",
      "discussionPoints": ["Frontend bundle optimization", "Vercel SPA routing"],
      "importantDecisions": ["Approved migration to Vercel global edge CDN"],
      "keyHighlights": ["88% bundle reduction achieved"],
      "problemsDiscussed": ["CORS credentials on multi-domain setup"],
      "proposedSolutions": ["Configured explicit origin array in backend"],
      "followUpRequirements": ["David to verify Vercel preview deployment"]
    }
  }
}
```

### `POST /api/ai/chat`
Interactive meeting assistant query grounded in meeting minutes.

**Request Body:**
```json
{
  "roomName": "meet-4a2b-9f1c",
  "question": "What did David agree to do?"
}
```

**Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "answer": "David agreed to configure the production vercel.json rewrites by tomorrow.",
    "groundedQuotes": ["I will configure the production vercel.json rewrites by tomorrow."]
  }
}
```

---

## 5. Task & Collaboration Endpoints

### `GET /api/action-items`
Lists workspace action items with filter parameters (`?meetingId=...&status=pending`).

### `POST /api/action-items`
Creates a new task linked to meeting decisions.

### `PATCH /api/action-items/:id`
Updates task status (`pending` $\leftrightarrow$ `in_progress` $\leftrightarrow$ `completed`).

---

## 6. Real-Time Socket.io Events Reference

### Client $\to$ Server Events
| Event | Payload | Purpose |
| :--- | :--- | :--- |
| `join-room` | `{ roomId, user: { id, name, isHost } }` | Joins a video meeting signaling channel |
| `leave-room` | `{ roomId }` | Leaves meeting and triggers peer cleanup |
| `offer` | `{ to, offer }` | Relays WebRTC SDP Offer to peer |
| `answer` | `{ to, answer }` | Relays WebRTC SDP Answer to peer |
| `ice-candidate` | `{ to, candidate }` | Relays Trickle ICE candidates |
| `chat-message` | `{ roomId, message, sender }` | Broadcasts and persists room chat message |
| `media-state-changed` | `{ roomId, isMuted, isVideoOff }` | Propagates audio/video mute status |
| `screen-share-changed` | `{ roomId, isSharing }` | Notifies peers of screen share stream |
| `mute-participant` | `{ targetSocketId, roomId }` | (Host Only) Force-mutes a participant |
| `end-meeting` | `{ roomId }` | (Host Only) Concludes meeting for all peers |

### Server $\to$ Client Events
| Event | Payload | Purpose |
| :--- | :--- | :--- |
| `room-users` | `[{ socketId, userId, userName, isHost }]` | Initial participant roster upon joining |
| `user-joined` | `{ socketId, userId, userName }` | Broadcast when a new peer enters |
| `user-left` | `{ socketId, userId }` | Broadcast when a peer disconnects |
| `chat-message` | `{ id, sender, text, timestamp }` | Incoming real-time chat message |
| `active-speaker` | `{ socketId, audioLevel }` | Real-time speaker audio indicator |
| `meeting-ended` | `{ roomId }` | Closes room when terminated by host |
