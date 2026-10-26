# Study Assistant - AI-Powered Flashcard Generator

A full-stack study tool inspired by how students actually learn. Paste your notes or name any topic and the system **instantly generates AI-powered flashcards** via Groq, then lets you flip through them or challenge yourself with an adaptive quiz that automatically re-tests the cards you get wrong.

**Live Demo (Frontend):** [study-assistant-nu-kohl.vercel.app](https://study-assistant-nu-kohl.vercel.app)
**Backend API:** Hosted on [Render.com](https://render.com)
**GitHub Repository:** [github.com/ayush14cyber/study-assistant](https://github.com/ayush14cyber/study-assistant)

---

## Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Installation & Setup](#-installation--setup)
- [Environment Variables](#-environment-variables)
- [Running the Application](#-running-the-application)
- [How the AI Pipeline Works](#-how-the-ai-pipeline-works)
- [Handling Bad AI Output](#-handling-bad-ai-output)
- [Quiz Engine Logic](#-quiz-engine-logic)
- [Frontend Architecture](#-frontend-architecture)
- [API Reference](#-api-reference)
- [Design System](#-design-system)
- [Deploying to Production (Render + Vercel)](#-deploying-to-production-render--vercel)
- [Troubleshooting](#-troubleshooting)
- [Limitations](#-limitations)
- [What I''d Do Next](#-what-id-do-next)

---

## Overview

**Study Assistant** is a full-stack web application that turns any text raw lecture notes, a Wikipedia paste, or just a topic name into interactive flashcards using Groq AI (model: `openai/gpt-oss-120b`). The browser never talks to Groq directly; all AI calls are proxied through a secure Express backend that holds the API key.

Once flashcards are generated, the user can:

1. **Browse mode** flip each card with a smooth CSS 3D animation to reveal the answer, then navigate with Prev/Next.
2. **Quiz mode** read the question, reveal the answer, then self-mark as "Got it" or "Review again". Cards marked wrong are automatically queued into a new round so you only stop when you know everything.

The frontend is a React SPA deployed on Vercel. The backend is an Express server deployed on Render. In development, Vite proxies `/api` requests to `localhost:3001` so no CORS configuration is needed locally.

---

## Key Features

| Category | Feature |
|---|---|
| **AI Generation** | Sends user text to Groq via a secure backend proxy. Returns 58 structured flashcards as validated JSON. |
| **Browse Mode** | CSS 3D flip animation (perspective + rotateY) reveals the answer on click. Prev/Next navigation with a live progress bar. |
| **Quiz Mode** | Self-assessment loop "Got it" advances, "Review again" queues the card for re-test. Quiz ends only when all cards are answered correctly. |
| **Multi-Round Re-testing** | Wrong cards from round N automatically become the deck for round N+1. Round number is displayed so the user knows they are in a re-test loop. |
| **Stale Request Protection** | `requestIdRef` increments on every Generate click. Any response that does not match the current request ID is silently discarded no race conditions. |
| **AI Output Validation** | Backend strips markdown fences, extracts raw JSON, validates the `flashcards` array shape, and returns a structured error if anything is wrong. |
| **Responsive Layout** | Mobile-first CSS. Quiz action buttons stack vertically on screens = 500px. Cards shrink gracefully. Works on any phone. |
| **Dark Theme** | Near-black background (`#0f1117`), purple accent (`#6c63ff`), Inter font from Google Fonts. Zero flicker on load. |
| **Retry Button** | On any network or AI error, a Retry button is shown inside the error bar that re-runs the same request without clearing the input. |
| **Health Check Endpoint** | `GET /health` returns `{"status":"ok"}` used by Render to verify the server is alive after a cold start. |

---

## Tech Stack

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| **Frontend** | React | 18.x | Component-based SPA |
| **Build Tool** | Vite | 5.x | Dev server (with proxy) and production bundler |
| **Styling** | Vanilla CSS | | Custom design system with CSS variables, dark theme, animations |
| **Typography** | Inter (Google Fonts) | 400700 | Clean, modern sans-serif |
| **Backend** | Node.js + Express | 4.x | REST API server and Groq proxy |
| **AI Provider** | Groq Cloud | | LLM inference via `openai/gpt-oss-120b` |
| **CORS** | `cors` npm package | 2.x | Whitelist Vercel frontend origin on Render |
| **Env Management** | `dotenv` | 16.x | Load `backend/.env` in development |
| **Dev Runner** | `concurrently` | 8.x | Run Express + Vite in one terminal with `npm start` |
| **Frontend Hosting** | Vercel | | Auto-deploys from `main` branch |
| **Backend Hosting** | Render.com | | Node.js Web Service with env var management |

---

## Project Structure

```
study-assistant/

+-- README.md # This file
+-- index.html # HTML entry point (Google Fonts, meta tags, #root mount)
+-- vite.config.js # Vite config dev proxy: /api ? http://localhost:3001
+-- package.json # Root scripts: npm start, npm run dev, npm run build
+-- .gitignore # Excludes node_modules/, dist/, backend/.env

+-- src/ # -- React Frontend --
+-- main.jsx # ReactDOM.createRoot entry point
+-- App.jsx # Root component all state, fetch logic, mode switching
+-- index.css # Design tokens, dark theme, flip animation, responsive styles
+-- components/
+-- FlashCard.jsx # Single card CSS 3D flip on click, front/back faces
+-- Quiz.jsx # Quiz runner show/hide answer, correct/wrong tracking, re-test loop

+-- backend/ # -- Express Backend --
+-- server.js # Express app CORS, /api/generate, /health
+-- .env # Local secrets (NOT committed to git)
+-- .env.example # Template showing all required keys
+-- package.json # Backend-only deps: express, cors, dotenv
```

---

## Prerequisites

| Requirement | Version | Notes |
|---|---|---|
| **Node.js** | >= 18.x | Required for both frontend and backend (`server.js` uses built-in `fetch`) |
| **npm** | >= 9.x | Comes bundled with Node.js |
| **Groq API Key** | | Free at [console.groq.com](https://console.groq.com). Required for AI generation. |
| **Git** | Any | To clone the repository |

> ?? **Node 18+ is required.** `server.js` uses the built-in `fetch` API (no `node-fetch` package). Earlier Node versions do not have it.

---

## Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/ayush14cyber/study-assistant.git
cd study-assistant
```

### 2. Install Frontend Dependencies

```bash
npm install
```

### 3. Install Backend Dependencies

```bash
cd backend && npm install && cd ..
```

### 4. Configure the Backend Environment

Create `backend/.env` (copy from the example):

```bash
cp backend/.env.example backend/.env
```

Then open `backend/.env` and fill in your values (see [Environment Variables](#-environment-variables) below).

### 5. Start Both Servers

```bash
npm start
```

This runs `concurrently "node backend/server.js" "vite"`. Both servers start in the same terminal:

- **Frontend:** `http://localhost:5173`
- **Backend:** `http://localhost:3001`

Vite''s dev proxy automatically forwards all `/api` requests from the browser to `localhost:3001` no CORS issues in development.

---

## Environment Variables

### Backend `backend/.env`

```env
# Your Groq API key get one free at https://console.groq.com
GROQ_API_KEY=gsk_your_groq_api_key_here

# Port the Express server listens on (Render sets this automatically in production)
PORT=3001

# The exact frontend origin to allow in the CORS header.
# Development: http://localhost:5173
# Production on Render: set to your Vercel URL, e.g. https://study-assistant-nu-kohl.vercel.app
ALLOWED_ORIGIN=http://localhost:5173
```

> **CORS in production**: `ALLOWED_ORIGIN` must exactly match the `Origin` header the browser sends no trailing slash. See [Troubleshooting](#-troubleshooting) if you still get CORS errors.

### Frontend No `.env` needed in development

Vite proxies all `/api` requests to `localhost:3001` automatically via `vite.config.js`. No environment variable is needed locally.

In **production on Vercel**, set one environment variable via Vercel''s dashboard:

```env
# The full URL of your Render backend (no trailing slash)
VITE_API_URL=https://your-backend.onrender.com
```

> ?? **`VITE_API_URL` is baked into the build at compile time.** After changing it in Vercel''s dashboard, trigger a manual redeploy (Deployments ? Redeploy) before the new value takes effect.

---

## Running the Application

**Single command (recommended):**

```bash
npm start
```

**Or run each server in a separate terminal:**

```bash
# Terminal 1 Backend
node backend/server.js

# Terminal 2 Frontend
npx vite
```

Open **`http://localhost:5173`** in your browser.

---

## How the AI Pipeline Works

When the user types a topic or pastes notes and clicks **Generate Flashcards**, the following 7-step pipeline runs:

```
1. User clicks Generate (empty inputs are rejected immediately)
?
2. requestIdRef increments (stale response guard armed)
?
3. Frontend POSTs { text } to /api/generate
?
4. Backend validates body rejects empty text with 400
?
5. Backend calls Groq API (model: openai/gpt-oss-120b, temp: 0.6)
?
6. Backend runs extractJSON() strips fences, validates shape
?
7. Backend returns { title, flashcards[] } ? React renders Browse mode
```

### System Prompt Design

The system prompt is carefully engineered to force deterministic output:

```
You are a study assistant. The user gives you notes or a topic.
Return ONLY a valid JSON object, no markdown, no code fences, no explanation.
The JSON must follow this exact shape:
{"title":"short topic title","flashcards":[{"id":1,"front":"question or term","back":"answer or definition"}]}
Generate 5 to 8 flashcards. Return ONLY the JSON.
```

Key design decisions:
- **"Return ONLY"** repeated twice significantly reduces fence-wrapping behavior
- **Exact shape specified inline** reduces hallucinated field names
- **Temperature 0.6** balanced between creativity and structural consistency

### `extractJSON` Multi-Strategy Parser

Even with a strict prompt, LLMs occasionally wrap output in markdown fences. The backend handles every known failure mode in sequence:

```
Strategy 1: JSON.parse(text) directly
? fastest; works when the model behaves perfectly

Strategy 2: Regex strip markdown fences (```json ... ```)
? handles the most common failure mode

Strategy 3: Slice from first '{' to last '}'
? last resort for partial fences or preamble text

Strategy 4: Throw "Could not extract JSON"
? triggers a clean 500 with a user-facing Retry message
```

---

## Handling Bad AI Output

Every known failure mode is handled before anything reaches the frontend:

| Failure | What Happens |
|---|---|
| Model wraps JSON in ` ```json ... ``` ` | Regex strips the fences; JSON extracted cleanly (Strategy 2) |
| Malformed / unparseable JSON | All three strategies tried; 500 returned with a clear message if all fail |
| Response has no `flashcards` array | Shape validated after parse; rejected if missing |
| `flashcards` is empty | Caught by `parsed.flashcards.length === 0` check |
| Empty content from Groq | Caught before parsing; error returned immediately |
| Groq API returns 4xx or 5xx | HTTP status checked; Groq''s raw error text forwarded |
| User clicks Generate again mid-request | `requestIdRef` mismatch detected; stale response silently discarded |
| Network failure | `try/catch` in frontend fetch; error state rendered with Retry button |

The frontend always shows exactly one of three states: **loading** (spinner), **error** (message + Retry), or **success** (cards).

---

## Quiz Engine Logic

The Quiz component implements a multi-round adaptive loop:

### State Machine

```
idle (deck = all cards, round = 1)
? User clicks "Show Answer"
? "Got it" ? correct++, advance
? "Review again" ? add to wrong[], advance
? Last card of round reached
+-- wrong[] is empty ? done = true ? show score screen
+-- wrong[] has cards ? deck = wrong[], index = 0, round++, repeat
```

### Key Behaviors

| Behavior | Implementation |
|---|---|
| **Self-assessment** | User self-marks correct or wrong no string matching needed |
| **Multi-round re-test** | Wrong cards automatically become the deck for round N+1 |
| **Round counter** | Displayed only from round 2 onward round 1 looks clean |
| **Score screen** | Shows `correct / deck.length` with round number |
| **Exit any time** | "Back to Flashcards" on the score screen calls `onExit` prop |
| **Fresh start** | `<Quiz key={cards.length} />` remount resets all state on new generation |

---

## Frontend Architecture

### Component Tree

```
App.jsx (all state lives here)
+-- <textarea /> Controlled input
+-- <button> Generate Triggers handleGenerate()
+-- status-bar.loading Spinner while awaiting Groq
+-- status-bar.error Error message + Retry button
+-- (success state)
+-- topic-header Topic title + Browse/Quiz tabs
+-- browse-section
+-- progress-bar Fill tracks current card / total
+-- <FlashCard /> Stateless receives card prop, manages flip locally
+-- flip-hint "Click the card to flip"
+-- card-nav Prev / Next (disabled at boundaries)
+-- <Quiz /> Full quiz runner with own deck state
```

### State in `App.jsx`

| State Variable | Type | Purpose |
|---|---|---|
| `input` | `string` | Controlled textarea value |
| `status` | `'idle' \| 'loading' \| 'error' \| 'success'` | Drives which UI section renders |
| `error` | `string` | Error message for the error bar |
| `title` | `string` | Topic title returned by AI |
| `cards` | `array` | Flashcard array from AI response |
| `mode` | `'browse' \| 'quiz'` | Active view after generation |
| `cardIndex` | `number` | Current card position in Browse mode |
| `requestIdRef` | `useRef(number)` | Stale-response guard; increments on every Generate click |

### `FlashCard.jsx` 3D Flip Animation

```
flip-card (perspective: 1200px)
+-- flip-card-inner (transform-style: preserve-3d, transition: rotateY 0.45s cubic-bezier)
+-- flip-card-front (backface-visibility: hidden) Question face
+-- flip-card-back (rotateY: 180deg, backface-visibility: hidden) Answer face
```

Clicking toggles the `flipped` boolean ? adds/removes `.flipped` class ? CSS rotates the inner container 180. `backface-visibility: hidden` ensures only one face is visible at any rotation angle.

---

## API Reference

The backend exposes two endpoints. All requests hit `http://localhost:3001` in development and your Render URL in production.

### POST `/api/generate`

Sends user text to Groq and returns validated flashcard data.

**Request Body:**
```json
{
"text": "The French Revolution was a period of radical political and social transformation..."
}
```

**Success Response (200):**
```json
{
"title": "French Revolution",
"flashcards": [
{ "id": 1, "front": "When did the French Revolution begin?", "back": "1789" },
{ "id": 2, "front": "What was the Bastille?", "back": "A medieval fortress in Paris, stormed on July 14, 1789" }
]
}
```

**Error Responses:**

| Status | Condition | Body |
|---|---|---|
| `400` | Empty or missing `text` | `{ "error": "Please provide some text or a topic." }` |
| `500` | Groq API error | `{ "error": "Groq API error 429: ..." }` |
| `500` | Unparseable AI output | `{ "error": "AI returned malformed JSON. Please try again." }` |
| `500` | Wrong response shape | `{ "error": "AI response had unexpected shape. Please try again." }` |
| `500` | Empty AI content | `{ "error": "Empty response from AI." }` |

---

### GET `/health`

Used by Render to verify the server is alive after a cold start.

**Response (200):**
```json
{ "status": "ok" }
```

---

## Design System

All design tokens are defined as CSS custom properties in `src/index.css`:

| Token | Value | Usage |
|---|---|---|
| `--bg` | `#0f1117` | Page background near-black |
| `--surface` | `#1a1d27` | Card fronts, textarea, loading bar |
| `--surface2` | `#22263a` | Card backs, secondary surfaces |
| `--border` | `#2e3350` | All borders and dividers |
| `--accent` | `#6c63ff` | Primary buttons, progress fill, score |
| `--accent-hover` | `#5a52e0` | Hover state for accent elements |
| `--text` | `#e8eaf6` | Primary text |
| `--text-muted` | `#8b90b0` | Subtitles, labels, hints |
| `--success` | `#4caf8a` | "Got it" button |
| `--danger` | `#f06070` | Error bar, "Review again" button |

**Typography:** `Inter` (Google Fonts, weights 400700) loaded via `<link>` preconnect in `index.html`.

**Animations:**
- Card flip: `rotateY(180deg)` with `cubic-bezier(0.4, 0, 0.2, 1)`, 0.45s
- Loading spinner: `@keyframes spin` at 0.7s linear infinite
- Progress bar: `transition: width 0.3s ease`
- Button press: `transform: scale(0.97)` on `:active`

---

## Deploying to Production (Render + Vercel)

### Backend Render.com

1. Go to [render.com](https://render.com) ? **New ? Web Service**
2. Connect your GitHub repository
3. Configure:

| Setting | Value |
|---|---|
| **Root Directory** | `backend` |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `node server.js` |

4. Add Environment Variables on Render:

| Key | Value |
|---|---|
| `GROQ_API_KEY` | Your Groq API key |
| `ALLOWED_ORIGIN` | Your Vercel URL with **no trailing slash**, e.g. `https://study-assistant-nu-kohl.vercel.app` |

5. Click Deploy. Note your Render service URL.

---

### Frontend Vercel

1. Go to [vercel.com](https://vercel.com) ? **New Project** ? import repo
2. Configure:

| Setting | Value |
|---|---|
| **Root Directory** | `.` (repo root, where `index.html` lives) |
| **Framework Preset** | `Vite` |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |

3. Add Environment Variable:

| Key | Value |
|---|---|
| `VITE_API_URL` | `https://your-backend.onrender.com` (no trailing slash) |

4. Deploy. Every `git push` to `main` auto-deploys.

> ?? **Free Tier Spin-down**: Render free tier spins down after 15 min of inactivity. First request after wake-up takes ~3050s.

> ?? **VITE_API_URL is a build-time variable**: Changing it on Vercel requires a manual redeploy to take effect.

---

## Troubleshooting

| Problem | Cause | Solution |
|---|---|---|
| **CORS error in browser** | `ALLOWED_ORIGIN` on Render does not exactly match the browser''s `Origin` | Open DevTools ? Network ? check the failing request''s `Origin` header. Set `ALLOWED_ORIGIN` on Render to that exact string with no trailing slash. Redeploy. |
| **"Failed to fetch" no network request** | `VITE_API_URL` is wrong or missing on Vercel | Check Vercel ? Settings ? Environment Variables. Trigger a redeploy after any change. |
| **Malformed JSON error on every request** | Model responding unexpectedly for that input | Click Retry. `extractJSON` handles most cases. A second attempt almost always succeeds. |
| **429 error from Groq** | Free tier rate limit exceeded | Wait 60 seconds and retry. |
| **"fetch is not defined" on backend** | Node.js version < 18 | Upgrade to Node 18+. Run `node --version` to check. |
| **Backend not starting locally** | Missing `backend/.env` | Create it from `backend/.env.example` and add your `GROQ_API_KEY`. |
| **Vite proxy not forwarding** | Backend running on wrong port | `vite.config.js` proxies to port 3001. Ensure `PORT` in `backend/.env` is `3001` or update `vite.config.js`. |
| **Cards lost on page refresh** | No session persistence | Known limitation. See [What I''d Do Next](#-what-id-do-next). |
| **Render first request slow** | Free tier cold start | Expected takes 3050s after 15 min of inactivity. Subsequent requests are fast. |

---

## Limitations

### AI Output
- Content is not fact-checked a flashcard can be factually wrong and still pass validation
- The model occasionally returns fewer than 5 cards for very short or vague inputs
- The `extractJSON` slice fallback (first `{` to last `}`) can produce garbage for severely broken output Retry resolves this in virtually all cases

### Frontend
- No session persistence refreshing loses all cards and quiz progress
- Regenerating resets both Browse and Quiz state from scratch
- Dark theme only no light mode toggle
- No streaming the user waits for the full Groq response before any cards render

### Backend / API
- Groq free tier enforces rate limits; rapid requests may hit a 429 error
- No server-side rate limiting all throttling is on Groq''s end
- No automatic retry on malformed AI output the user must click Retry manually
- No authentication `/api/generate` is open to anyone with the URL

---

## What I''d Do Next

- **Server-side auto-retry**: Automatically retry once when the AI returns malformed JSON instead of surfacing the error to the user
- **Session persistence**: Save the last generated topic and cards to `localStorage` so a refresh doesn''t wipe progress
- **Streaming**: Stream the Groq response token-by-token and render cards as they arrive
- **Server-side rate limiting**: Add per-IP rate limiting with `express-rate-limit` to protect the backend independently of Groq
- **Keyboard navigation**: Arrow keys to navigate, `Space` to flip, `1`/`2` to mark quiz answers
- **Export**: Let users download flashcards as CSV or Anki-compatible `.apkg`
- **Light mode**: Respect `prefers-color-scheme` and add a toggle
- **Unit tests**: Cover all three `extractJSON` strategies and the shape validator in `server.js`

---

## Time Spent

**Total: ~7 hours**

| Area | Time | What was done |
|---|---|---|
| Project setup & tooling | 30 min | Vite + React scaffold, concurrently dev script, backend package.json, `.env`, `.gitignore`, Render/Vercel config |
| Backend — Express server & Groq integration | 1 hr 15 min | `/api/generate` route, Groq API call, system prompt design, CORS config, `/health` endpoint |
| `extractJSON` + input validation | 45 min | Multi-strategy JSON parser (3 fallbacks), gibberish heuristic (`looksLikeGibberish`), AI-layer `{invalid:true}` detection |
| Frontend — App state & fetch logic | 1 hr | All React state (`input`, `status`, `error`, `title`, `cards`, `mode`, `cardIndex`), `requestIdRef` stale-guard, error handling |
| FlashCard component & CSS 3D flip | 45 min | Perspective + `rotateY` animation, `backface-visibility`, front/back faces, keyboard accessibility |
| Quiz component — multi-round engine | 1 hr | Self-assessment loop, wrong-card re-test queue, round counter, score screen, percentage calculation |
| UI design & CSS design system | 1 hr | CSS custom properties, rose/blush palette, editorial header, input card, pill tabs, progress bar, responsive layout |
| Deployment & debugging | 30 min | Vercel env vars, Render env vars, CORS trailing-slash fix, Vite proxy config |
| README documentation | 15 min | Full project documentation — architecture, API reference, troubleshooting, deployment guide |

---

## AI Usage

Groq (`openai/gpt-oss-120b`) generates flashcards from user input. I used **Antigravity** (AI coding assistant) to help scaffold boilerplate. I wrote and understand all the component logic, state design, error handling, the `requestIdRef` stale-guard, and the multi-strategy `extractJSON` approach. The code was manually tested for both happy paths and all documented failure cases.

---

## License

This project is licensed under the **ISC License**.

---

<p align="center">
Built with ?? using React, Express, Groq AI, Vite, Render, and Vercel
</p>

