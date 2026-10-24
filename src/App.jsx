import { useState, useRef } from 'react'
import FlashCard from './components/FlashCard'
import Quiz from './components/Quiz'

// VITE_API_URL is set on Vercel to the Render backend URL.
// In dev it is undefined, and Vite proxies /api to localhost:3001.
const API_URL = import.meta.env.VITE_API_URL || '';

function App() {
  const [input, setInput] = useState('')
  const [status, setStatus] = useState('idle')   // idle | loading | error | success
  const [error, setError] = useState('')
  const [title, setTitle] = useState('')
  const [cards, setCards] = useState([])
  const [mode, setMode] = useState('browse')      // browse | quiz
  const [cardIndex, setCardIndex] = useState(0)

  // Prevent stale responses from overwriting newer ones
  const requestIdRef = useRef(0)

  async function handleGenerate() {
    if (!input.trim()) return

    const requestId = ++requestIdRef.current
    setStatus('loading')
    setError('')
    setCards([])
    setMode('browse')
    setCardIndex(0)

    try {
      const res = await fetch(API_URL + '/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: input.trim() })
      })

      // If this request is stale (user clicked Generate again), ignore
      if (requestId !== requestIdRef.current) return

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong')
      }

      // Validate the shape we expect
      if (!Array.isArray(data.flashcards) || data.flashcards.length === 0) {
        throw new Error('AI returned unexpected data. Please try again.')
      }

      setTitle(data.title || 'Flashcards')
      setCards(data.flashcards)
      setStatus('success')
    } catch (err) {
      if (requestId !== requestIdRef.current) return
      setError(err.message)
      setStatus('error')
    }
  }

  function prev() {
    setCardIndex(i => Math.max(0, i - 1))
  }

  function next() {
    setCardIndex(i => Math.min(cards.length - 1, i + 1))
  }

  return (
    <div className="app">
      <h1>Study Assistant</h1>
      <p className="subtitle">Paste your notes or a topic — get AI flashcards instantly</p>

      {/* Input area */}
      <div className="input-section">
        <textarea
          id="notes-input"
          placeholder="e.g. Paste your notes here, or just type a topic like 'Photosynthesis' or 'World War 2 causes'..."
          value={input}
          onChange={e => setInput(e.target.value)}
          disabled={status === 'loading'}
        />
        <button
          id="generate-btn"
          className="btn-primary"
          onClick={handleGenerate}
          disabled={status === 'loading' || !input.trim()}
        >
          {status === 'loading' ? 'Generating...' : 'Generate Flashcards'}
        </button>
      </div>

      {/* Loading */}
      {status === 'loading' && (
        <div className="status-bar loading">
          <div className="spinner" />
          Asking Groq AI to create flashcards...
        </div>
      )}

      {/* Error */}
      {status === 'error' && (
        <div className="status-bar error">
          <span>ERROR: {error}</span>
          <button className="btn-secondary" style={{ marginLeft: 'auto' }} onClick={handleGenerate}>
            Retry
          </button>
        </div>
      )}

      {/* Results */}
      {status === 'success' && cards.length > 0 && (
        <>
          <div className="topic-header">
            <span className="topic-title">{title}</span>
            <div className="mode-tabs">
              <button
                id="browse-tab"
                className={mode === 'browse' ? 'btn-primary' : 'btn-secondary'}
                onClick={() => { setMode('browse'); setCardIndex(0) }}
              >
                Browse
              </button>
              <button
                id="quiz-tab"
                className={mode === 'quiz' ? 'btn-primary' : 'btn-secondary'}
                onClick={() => setMode('quiz')}
              >
                Quiz
              </button>
            </div>
          </div>

          {/* Browse mode */}
          {mode === 'browse' && (
            <div className="browse-section">
              <p className="card-counter">{cardIndex + 1} / {cards.length}</p>

              <div className="progress-bar">
                <div className="progress-fill" style={{ width: ((cardIndex + 1) / cards.length * 100) + '%' }} />
              </div>

              <FlashCard key={cardIndex} card={cards[cardIndex]} />

              <p className="flip-hint">Click the card to flip</p>

              <div className="card-nav">
                <button id="prev-btn" className="btn-secondary" onClick={prev} disabled={cardIndex === 0}>
                  Prev
                </button>
                <button id="next-btn" className="btn-secondary" onClick={next} disabled={cardIndex === cards.length - 1}>
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Quiz mode */}
          {mode === 'quiz' && (
            <Quiz key={cards.length} cards={cards} onExit={() => setMode('browse')} />
          )}
        </>
      )}
    </div>
  )
}

export default App