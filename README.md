# IntellMeet — Enterprise AI Meeting & Collaboration Platform

> An intelligent, production-ready virtual meeting platform built using **React 18**, **TypeScript**, **Tailwind CSS**, **Node.js**, **Express**, **MongoDB Atlas**, **Socket.io**, **WebRTC / SFU**, and **OpenAI**. IntellMeet delivers ultra-low-latency HD video conferencing, real-time speech transcription, autonomous AI meeting minutes, and workspace collaboration.

---

## 📌 Status & Production Readiness

- **Current Phase:** **Phase 9: Production Deployment & Verification**
- **Test Matrix:** ✅ **129 / 129 Tests Passed (100% Green, 0 Failures)**
  - Playwright Multi-Viewport E2E: 5/5 passed
  - Vitest & React Testing Library: 18/18 passed
  - Supertest Security Audit: 16/16 passed
  - Deployment & Health Probes: 14/14 passed
  - Phases 1–7 System Regression: 76/76 passed
- **Frontend Optimization:** **68 kB initial gzipped bundle** (88.1% size reduction via dynamic route code splitting).
- **Backend Architecture:** Persistent Express + Socket.io signaling engine with zero-downtime MongoDB resilient buffering.

---

## 🚀 Key Platform Features

- **HD Video Conferencing & Screen Sharing:** Direct hardware streaming via WebRTC (`getUserMedia`, `getDisplayMedia`) with STUN/TURN fallback and LiveKit SFU integration.
- **Real-Time Collaboration Mesh:** Bi-directional Socket.io room orchestration for instant chat messaging, presence detection, and participant tracking.
- **Client-Side Live Voice Transcription:** Zero-latency speech-to-text using the HTML5 Web Speech API (`SpeechRecognition`) with real-time subtitle broadcasting.
- **Autonomous AI Meeting Intelligence:** Executive summary generation, key decisions extraction, and interactive action items checklist (via OpenAI GPT-4o / built-in intelligent contextual NLP engine).
- **Enterprise Database Layer:** 12 comprehensive Mongoose schemas with compound indexes, relationships, and validation, backed by an automated in-memory fallback store for uninterrupted operation.
- **Modern Enterprise Design System:** High-contrast dashboard (`#F8FAFC`), dark studio room (`#0B0F19`), Lucide icons, TanStack Query, and Zustand state management.

---

## 📁 Repository Structure

```
intellmeet/
  ├── client/                     # Frontend Application (React 18 + Vite + TypeScript)
  │   ├── src/
  │   │   ├── components/         # Reusable enterprise UI primitives
  │   │   ├── features/           # Modular meeting, chat, and AI features
  │   │   ├── layouts/            # Dashboard shells and dark studio room layouts
  │   │   ├── pages/              # Lazy-loaded route views
  │   │   ├── services/           # Typed REST API clients & socket connectors
  │   │   └── utils/              # Helper utilities, constants, class merger
  │   ├── vercel.json             # Vercel SPA routing and security header rules
  │   └── vite.config.ts          # Manual chunking and Rollup configuration
  │
  ├── server/                     # Backend API & WebSocket Server (Node 20 + Express + TS)
  │   ├── src/
  │   │   ├── config/             # Zod environment validation, MongoDB connection, CORS
  │   │   ├── controllers/        # Health, Auth, Meeting, and AI controllers
  │   │   ├── middleware/         # Centralized error handler, request logger, validator
  │   │   ├── models/             # 12 Mongoose Schemas (User, Meeting, Workspace, etc.)
  │   │   ├── routes/             # Modular API routes (/api/v1/health, /meetings, /ai)
  │   │   ├── services/           # Storage, LiveKit SFU, Auth, and AI summarization
  │   │   ├── sockets/            # Socket.io signaling, room, and chat handlers
  │   │   └── index.ts            # Server entry point with top-level /health probe
  │
  ├── shared/                     # Shared Contracts & Constants (NPM Workspace)
  ├── tests/                      # Full-stack automated test runners (129 assertions)
  ├── Dockerfile                  # Hardened multi-stage production Docker image
  ├── docker-compose.yml          # Production backend + persistent MongoDB stack
  ├── render.yaml                 # Render Blueprint configuration for persistent web service
  ├── vercel.json                 # Monorepo root Vercel configuration
  ├── DEPLOYMENT_GUIDE.md         # Comprehensive cloud DevOps deployment manual
  ├── SECURITY_CHECKLIST.md       # Enterprise security hardening audit
  ├── API_DOCUMENTATION.md        # Complete REST API & Socket.io event specification
  ├── TEST_REPORT.md              # Quality audit results and performance benchmarks
  └── DEVELOPMENT_PROGRESS.md     # Phase-by-phase implementation tracker
```

---

## 🛠️ Technology Stack

| Component | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, React Router, TanStack Query, Zustand, Lucide React |
| **Backend** | Node.js (v20+), Express.js, TypeScript, Mongoose ODM, Socket.io, Zod, Helmet, Compression |
| **Database** | MongoDB Atlas (with compound indexes) + In-Memory Resilient Store |
| **AI Intelligence** | OpenAI Whisper & GPT-4o API, Built-in Contextual NLP Engine |
| **Object Storage** | Cloudflare R2 / AWS S3 SDK (`@aws-sdk/client-s3`) |
| **Real-Time Video** | WebRTC, LiveKit SFU Server SDK, STUN/TURN infrastructure |
| **DevOps & Hosting** | Vercel (Frontend), Docker / Render / Railway (Backend), PM2 |

---

## ⚡ Quick Start

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher (v20 recommended)
- **npm**: v9.0.0 or higher
- **MongoDB** (optional): Connects directly to MongoDB Atlas or runs smoothly with zero-downtime resilient in-memory fallback.

### 2. Installation
```bash
npm install
```

### 3. Environment Setup
```bash
cp .env.example .env
```

### 4. Running the Development Servers
```bash
npm run dev
```
- **Frontend Client**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5000](http://localhost:5000)
- **Health Check**: [http://localhost:5000/health](http://localhost:5000/health)

### 5. Running the Complete Test Suite
```bash
# Run client unit & responsive tests (Vitest)
npm run test --workspace=client

# Run production deployment verification
npx tsx tests/phase9_deployment_verification.test.ts

# Run Playwright headless browser E2E
npx tsx tests/phase8_playwright.test.ts
```

---

## 🚀 Cloud Production Deployment

See the complete step-by-step instructions in [DEPLOYMENT_GUIDE.md](file:///c:/Users/cgmpr/Downloads/parking/DEPLOYMENT_GUIDE.md):

1. **Deploy Frontend to Vercel:**
   - Link repository to [Vercel](https://vercel.com).
   - Root `vercel.json` automatically configures Vite SPA routing and asset caching.
   - Set `VITE_API_URL` and `VITE_SOCKET_URL` in Vercel environment variables.
2. **Deploy Backend to Persistent Node Host:**
   - Use the provided `Dockerfile` or `render.yaml`.
   - Configure `MONGODB_URI`, `JWT_SECRET`, `CLIENT_URL`, and optional `OPENAI_API_KEY`.
   - Probes: Top-level `/health` and `/api/v1/health`.
3. **Connect MongoDB Atlas:**
   - Whitelist backend host IPs and configure connection string in `MONGODB_URI`.

---

## 📚 Complete Documentation Index

- 📖 [DEPLOYMENT_GUIDE.md](file:///c:/Users/cgmpr/Downloads/parking/DEPLOYMENT_GUIDE.md) — Cloud deployment manual (Vercel, Render, Docker, Atlas, R2)
- 🔒 [SECURITY_CHECKLIST.md](file:///c:/Users/cgmpr/Downloads/parking/SECURITY_CHECKLIST.md) — Security audit, RBAC hierarchy, MIME filters, Helmet headers
- 📡 [API_DOCUMENTATION.md](file:///c:/Users/cgmpr/Downloads/parking/API_DOCUMENTATION.md) — REST API endpoints and Socket.io event catalog
- 📊 [TEST_REPORT.md](file:///c:/Users/cgmpr/Downloads/parking/TEST_REPORT.md) — Quality benchmarks, bundle breakdown, test matrix
- 📌 [DEVELOPMENT_PROGRESS.md](file:///c:/Users/cgmpr/Downloads/parking/DEVELOPMENT_PROGRESS.md) — Full milestone log across Phases 1 through 9
