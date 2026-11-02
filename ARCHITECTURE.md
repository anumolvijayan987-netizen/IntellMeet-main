# IntellMeet — Enterprise Architecture Blueprint

## 1. Executive Summary & Architectural Principles

IntellMeet is engineered as an enterprise-grade virtual collaboration platform designed for ultra-low latency audio/video communication, real-time multi-user interaction, client-side live speech transcription, and autonomous AI-driven meeting minutes extraction.

The architecture adheres to the following core tenets:
1. **Modularity & Separation of Concerns:** Loose coupling between presentation, transport, domain logic, and persistence.
2. **Type Safety Across Layers:** Shared contracts (`@intellmeet/shared`) ensure identical interfaces between client and server.
3. **Resilient Degradation:** If MongoDB or external AI services are unavailable, the system transparently utilizes in-memory fallback stores and heuristic NLP models without throwing unhandled exceptions.
4. **Zero-Latency Client-Side Transcription:** Utilizes browser-native HTML5 Web Speech API to eliminate transcription streaming costs and audio buffering overhead.
5. **Horizontal Scalability:** Modular Socket.io room partitioning allows future cluster adaptation via Redis adapter.

---

## 2. High-Level System Topology

```
+-------------------------------------------------------------------------+
|                              USER BROWSER                               |
|                                                                         |
|  +--------------------+  +--------------------+  +-------------------+  |
|  | WebRTC Media Engine|  | Web Speech STT API |  | React 18 UI Shell |  |
|  | (Camera/Mic/Screen)|  | (Local Subtitles)  |  | (Zustand & Query) |  |
|  +---------+----------+  +---------+----------+  +---------+---------+  |
+------------|-----------------------|-----------------------|------------+
             | Direct Media Stream   | Subtitle Chunks       | HTTP / WS
             | (P2P Mesh via STUN)   |                       |
             v                       v                       v
+-------------------------------------------------------------------------+
|                  INTELLMEET NODE.JS BACKEND SERVER                      |
|                                                                         |
|  +-------------------------------------------------------------------+  |
|  | Socket.io Real-Time Hub                                            |  |
|  |  - Room Partitioning (`join-room`, `leave-room`)                  |  |
|  |  - WebRTC Signaling Relay (`signal`, `offer`, `answer`, `ice`)    |  |
|  |  - Instant Chat Mesh (`send-message`, `receive-message`)           |  |
|  |  - Live Subtitle Broadcast (`transcript-chunk`)                   |  |
|  +-------------------------------------------------------------------+  |
|                                                                         |
|  +-------------------------------------------------------------------+  |
|  | Express REST API (v1)                                              |  |
|  |  - Health Monitor (`GET /api/v1/health`)                           |  |
|  |  - Meeting Intelligence (`POST /api/v1/meetings`)                  |  |
|  |  - AI Meeting Minutes Extraction (`POST /api/v1/ai/summarize`)     |  |
|  +-------------------------------------------------------------------+  |
|                                                                         |
|  +---------------------------+       +-------------------------------+  |
|  | AI Intelligence Engine    |       | Resilient Database Layer      |  |
|  |  - OpenAI GPT-4o-mini     |       |  - MongoDB (Mongoose 12 Mod.) |  |
|  |  - Heuristic NLP Fallback |       |  - In-Memory Backup Cache     |  |
|  +---------------------------+       +-------------------------------+  |
+-------------------------------------------------------------------------+
                                         |
                                         v
                         +-------------------------------+
                         | MongoDB Enterprise Database   |
                         | (12 Collections with Indexes) |
                         +-------------------------------+
```

---

## 3. Frontend Architecture (`client/`)

The frontend is structured as a modular Single Page Application (SPA) powered by Vite, React 18, and TypeScript:

- **`components/ui/`**: Atomic, accessible presentation primitives (Button, Badge, Card, Modal, Input).
- **`components/common/`**: Shell components including Navbar with real-time socket indicator and Sidebar.
- **`layouts/`**: `MainLayout` provides the persistent responsive shell; `MeetingLayout` maximizes video canvas space.
- **`stores/`**: Lightweight client state management via Zustand:
  - `meetingStore`: Local media controls (mic, camera, screen share), active participants count, live subtitles, chat list, action items checklist.
  - `authStore`: User identity, active workspace, and organization context.
- **`services/`**: Standardized fetch wrapper (`apiClient.ts`) handling base URLs, status serialization, and custom `ApiError`.
- **`hooks/`**: Specialized functional hooks:
  - `useWebRTC`: Hardware media acquisition (`getUserMedia`, `getDisplayMedia`), track mute/unmute handling, and peer connection teardown.
  - `useSpeechRecognition`: HTML5 Web Speech API lifecycle management, error resilience, and real-time subtitle event emission.
  - `useSocket`: React context hook exposing the singleton WebSocket instance.
- **`pages/`**:
  - `HomePage`: Enterprise dashboard with Quick Start, Room Code Join, Recent Meetings list, and System Architecture health monitor.
  - `MeetingPage`: Real-time video conferencing canvas, live spoken caption overlays, room chat drawer, and AI minutes generator.
  - `HistoryPage`: Database archive explorer for inspecting past meetings, key decisions, and action items.

---

## 4. Backend Architecture (`server/`)

The backend is built around Express.js and Socket.io with Clean Architecture principles:

- **Config Layer (`config/`)**: Environment validation via Zod (`env.ts`), database lifecycle management (`db.ts`), and CORS policy (`cors.ts`).
- **Middleware Pipeline (`middleware/`)**:
  - `requestLogger`: HTTP traffic analysis with status codes and duration timers.
  - `validate`: Zod schema enforcement on `body`, `query`, and `params`.
  - `errorHandler`: Centralized error catching with status codes, error categorization, and dev stack traces.
- **Models Layer (`models/`)**: 12 Mongoose models with strict typing, indexes, timestamps, and relations.
- **Services Layer (`services/`)**: Business domain logic:
  - `MeetingService`: Orchestrates meeting records, query pagination, and in-memory fallback cache.
  - `AiService`: Manages LLM integration and heuristic natural language processing for transcript summaries and action item parsing.
- **Sockets Hub (`sockets/`)**: Modular event handlers separated into room lifecycle, signaling, chat, and transcript streaming.

---

## 5. WebRTC & Real-Time Signaling Workflow

1. **Room Ingress:** User enters room `/room/:roomId`. Client emits `join-room` with `roomId`, `userName`, and `userId`.
2. **Signaling Exchange:**
   - Server registers participant in memory and broadcasts `user-joined` to other room members.
   - Clients create WebRTC `RTCPeerConnection` configured with public Google STUN servers (`stun.l.google.com:19302`).
   - Peers exchange SDP Offers, Answers, and ICE candidates via Socket.io `signal` relays.
3. **Peer Streaming:** Once ICE negotiation succeeds, peer audio and video tracks stream directly peer-to-peer (P2P), minimizing backend network bandwidth.
4. **Media Controls:** Audio and video track states are toggled locally via `track.enabled` and broadcast to peers via `media-state-change`.

---

## 6. Live Speech-to-Text & AI Summarization Pipeline

```
[ Microphone Input ]
         |
         v
[ HTML5 SpeechRecognition ] ---> Spoken words transcribed in browser (0ms API latency)
         |
         +---> Displays live subtitle overlay on top of video feed
         |
         +---> Emits `transcript-chunk` event via Socket.io to room participants
         |
         v
[ In-Meeting Transcript Log ]
         |
         v (User clicks "Generate AI Minutes" or Meeting Ends)
[ POST /api/v1/ai/summarize ]
         |
   +-----+-----+
   |           |
   v           v
[OpenAI API] [Built-in Contextual NLP Engine]
   |           |
   +-----+-----+
         |
         v
[ Structured Meeting Intelligence ]
  ├── Executive Summary
  ├── Key Decisions List
  └── Action Items with Assignees & Checkboxes
         |
         v
[ Saved to MongoDB / Displayed in Real-Time Drawer ]
```

---

## 7. Database Resiliency & In-Memory Store

To guarantee zero downtime in local development, testing, and continuous integration environments where MongoDB may not be actively running:
1. `DatabaseConnection` attempts connection to `MONGO_URI` with a 4-second timeout.
2. If connection succeeds, status transitions to `connected`.
3. If connection is refused, status transitions to `fallback_in_memory`.
4. `MeetingService` writes and reads to both MongoDB and an internal memory buffer.
5. All REST endpoints and health checks remain 100% operational, reporting `fallback_in_memory` status on `/api/v1/health`.

---

## 8. Security & Production Readiness

- **HTTP Security Headers:** Helmet middleware configured for cross-origin resource protection.
- **CORS Protection:** Configurable origin whitelisting across HTTP and WebSockets.
- **Input Validation:** Strict Zod schema validation prevents injection and malformed payloads.
- **Graceful Shutdown:** `SIGTERM` and `SIGINT` handlers close HTTP listeners, terminate active Socket connections, and safely disconnect MongoDB.
