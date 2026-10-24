# Study Assistant

Paste notes or a topic → get AI-generated flashcards → flip through them or take a quiz. Structured JSON from Groq, rendered as interactive React components.

---

## Setup

**Prerequisites:** Node.js 18+, Git, a free Groq API key from [console.groq.com](https://console.groq.com)

Clone the repo:
```bash
git clone <your-repo-url>
cd study-assistant
```

Install frontend dependencies:
```bash
npm install
```

Install backend dependencies:
```bash
cd backend && npm install && cd ..
```

Add your Groq API key — create `backend/.env`:
```env
GROQ_API_KEY=your_groq_api_key_here
```

Start both servers:
```bash
npm start
```

Frontend runs on **http://localhost:5173**, backend on **http://localhost:3001**.

**Environment variables:**
- Backend: `GROQ_API_KEY` (required), `PORT` (default 3001)
- Frontend: no env vars needed in dev — Vite proxies `/api` to `localhost:3001` automatically

---

## Usage

1. Type a topic (e.g. "French Revolution") or paste your notes into the text box
2. Click **Generate Flashcards**
3. In **Browse mode** — click a card to flip it; use Prev/Next to navigate
4. Switch to **Quiz mode** — read the question, click "Show Answer", then mark "Got it" or "Review again"
5. After finishing the quiz, wrong cards are automatically queued for a second round

---

## Mobile

The layout is responsive and works on phone screens. To preview on a laptop:

1. Open **http://localhost:5173** in Chrome
2. Press `F12` to open DevTools
3. Press `Ctrl+Shift+M` to enable the device toolbar
4. Select a phone size (e.g. iPhone 12, 375px width)

---

## Architecture

The browser never talks to Groq directly. All AI calls go through an Express backend that holds the API key in `.env`. The frontend sends a POST with the user's text; the backend constructs the prompt, calls Groq, parses and validates the JSON, then returns clean data to React.

### Request Flow

```
browser → POST /api/generate → Express → Groq API (openai/gpt-oss-120b) → JSON extraction + validation → response
```

### Project Structure

```
study-assistant/
├── src/
│   ├── App.jsx              # Root component: all state, fetch logic, mode switching
│   ├── main.jsx             # React DOM entry point
│   ├── index.css            # Design tokens, dark theme, flip animation, responsive layout
│   └── components/
│       ├── FlashCard.jsx    # Single card — CSS 3D flip on click, front/back faces
│       └── Quiz.jsx         # Quiz runner — show/hide answer, correct/wrong tracking, re-test loop
├── backend/
│   ├── server.js            # Express server, Groq API proxy, JSON extraction, validation
│   ├── .env                 # GROQ_API_KEY — never referenced in frontend code
│   └── package.json
├── index.html
├── vite.config.js           # Dev proxy: /api → http://localhost:3001
└── package.json             # Scripts: npm start runs both servers via concurrently
```

---

## Handling Bad AI Output

LLMs don't always return clean JSON. The backend handles every case before sending anything to the frontend:

| Failure | What happens |
|---|---|
| Model wraps JSON in ` ```json ... ``` ` | Regex strips the fences; JSON is extracted cleanly |
| Malformed / unparseable JSON | `try/catch` around `JSON.parse`; 500 returned with a clear message |
| Response has no `flashcards` array | Shape checked after parse; rejected if missing or empty |
| Empty content from Groq | Checked before parsing; error returned immediately |
| Groq API returns 4xx or 5xx | HTTP status checked; Groq's error message forwarded (not swallowed) |
| User clicks Generate again mid-request | `requestIdRef` in React increments on every call; any response that doesn't match the current ID is silently discarded |
| Network failure | `try/catch` in the frontend fetch; error state rendered with a Retry button |

The frontend always shows one of three states: loading (spinner), error (message + Retry), or success (cards).

---

## AI Usage

Groq (`openai/gpt-oss-120b`) generates flashcards from user input. I used **Antigravity** (AI coding assistant) to help write boilerplate and scaffold files. I wrote and understand all the component logic, state design, error handling, and the `extractJSON` strategy in the backend. The code was manually tested for both happy paths and failure cases.

---

## Limitations

### AI Output
- Content is not verified for correctness — a flashcard can be factually wrong and still pass validation
- The model occasionally returns fewer than 5 cards for very short inputs
- The `extractJSON` fallback (find first `{` to last `}`) can produce garbage if the model returns heavily broken output — a Retry usually fixes it

### Frontend
- No session persistence — refreshing loses all cards and quiz progress
- Regenerating resets both browse and quiz state from scratch
- Dark theme only; no light mode toggle
- No streaming — the user waits for the full result before anything renders

### Backend / API
- Groq free tier enforces rate limits; rapid repeated requests may hit a 429 error
- No server-side rate limiting implemented — all limiting is on Groq's end
- A single retry attempt is not implemented — if the AI returns bad JSON, the user must manually click Retry

---

## Time Spent

~6.5 hours total.

---

## What I'd Do Next

- Add a single automatic server-side retry when Groq returns invalid JSON, instead of asking the user to retry manually
- Persist the last session in `localStorage` so a page refresh doesn't wipe progress
- Stream the response as it generates so users see cards appear one by one instead of waiting
- Add server-side rate limiting per IP to protect the backend independently of Groq's limits
- Write unit tests for `extractJSON` and the shape validator in `server.js`
- Add keyboard navigation: arrow keys to flip/navigate cards, `1`/`2` for quiz answers