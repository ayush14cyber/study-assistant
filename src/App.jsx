import { useState, useRef, useEffect } from 'react'
import FlashCard from './components/FlashCard'
import Quiz from './components/Quiz'

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '')

function App() {
  const [input, setInput]         = useState('')
  const [status, setStatus]       = useState('idle')   // idle | loading | error | success
  const [error, setError]         = useState('')
  const [title, setTitle]         = useState('')
  const [cards, setCards]         = useState([])
  const [mode, setMode]           = useState('browse') // browse | quiz
  const [cardIndex, setCardIndex] = useState(0)
  const requestIdRef              = useRef(0)

  // Dark mode — persisted to localStorage
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])

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
      if (requestId !== requestIdRef.current) return
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Something went wrong')
      if (!Array.isArray(data.flashcards) || data.flashcards.length === 0)
        throw new Error('AI returned unexpected data. Please try again.')
      setTitle(data.title || 'Flashcards')
      setCards(data.flashcards)
      setStatus('success')
    } catch (err) {
      if (requestId !== requestIdRef.current) return
      setError(err.message)
      setStatus('error')
    }
  }

  const prev = () => setCardIndex(i => Math.max(0, i - 1))
  const next = () => setCardIndex(i => Math.min(cards.length - 1, i + 1))

  return (
    <>
      {/* ── Fixed dark/light toggle ── */}
      <button
        className="theme-toggle"
        onClick={() => setDark(d => !d)}
        title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
        aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {dark ? '☀️' : '🌙'}
      </button>

      <div className="app">

      {/* ── Header ── */}
      <header className="header">
        <div className="header-eyebrow">Powered by Groq AI</div>
        <h1>Turn notes into<br /><em>flashcards.</em></h1>
        <p className="subtitle">
          Paste any topic, lecture notes, or a concept — and get a ready-to-study deck in seconds.
        </p>
      </header>

      {/* ── Input ── */}
      <div className="input-card">
        <label className="input-label" htmlFor="notes-input">Your notes or topic</label>
        <textarea
          id="notes-input"
          placeholder={"Try: \"Mitosis\", \"The Cold War\", or paste a paragraph from your textbook..."}
          value={input}
          onChange={e => setInput(e.target.value)}
          disabled={status === 'loading'}
          rows={5}
        />
        <div className="input-footer">
          <span className="char-count">{input.length > 0 ? `${input.length} chars` : 'No input yet'}</span>
          <button
            id="generate-btn"
            className="btn-generate"
            onClick={handleGenerate}
            disabled={status === 'loading' || !input.trim()}
          >
            {status === 'loading' ? (
              <>
                <div className="spinner" />
                Generating...
              </>
            ) : (
              <>
                <span className="btn-icon">✦</span>
                Generate Flashcards
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Loading ── */}
      {status === 'loading' && (
        <div className="status-bar loading">
          <div className="spinner" />
          Asking Groq AI to create your flashcards...
        </div>
      )}

      {/* ── Error ── */}
      {status === 'error' && (
        <div className="status-bar error">
          <span>{error}</span>
          <button className="retry-btn" onClick={handleGenerate}>Retry</button>
        </div>
      )}

      {/* ── Results ── */}
      {status === 'success' && cards.length > 0 && (
        <>
          <div className="results-header">
            <div className="topic-badge">
              <span className="topic-dot" />
              {title}
            </div>
            <div className="mode-tabs">
              <button
                id="browse-tab"
                className={`tab-btn${mode === 'browse' ? ' active' : ''}`}
                onClick={() => { setMode('browse'); setCardIndex(0) }}
              >
                Browse
              </button>
              <button
                id="quiz-tab"
                className={`tab-btn${mode === 'quiz' ? ' active' : ''}`}
                onClick={() => setMode('quiz')}
              >
                Quiz
              </button>
            </div>
          </div>

          {/* Browse */}
          {mode === 'browse' && (
            <div className="browse-section">
              <div className="counter-row">
                <span className="card-counter">{cardIndex + 1} / {cards.length}</span>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: ((cardIndex + 1) / cards.length * 100) + '%' }} />
                </div>
              </div>

              <FlashCard key={cardIndex} card={cards[cardIndex]} />

              <p className="flip-hint">Click the card to reveal the answer</p>

              <div className="card-nav">
                <button id="prev-btn" className="btn-outline" onClick={prev} disabled={cardIndex === 0}>
                  ← Prev
                </button>
                <button id="next-btn" className="btn-outline" onClick={next} disabled={cardIndex === cards.length - 1}>
                  Next →
                </button>
              </div>
            </div>
          )}

          {/* Quiz */}
          {mode === 'quiz' && (
            <Quiz key={cards.length} cards={cards} onExit={() => setMode('browse')} />
          )}
        </>
      )}
    </div>
    </>
  )
}

export default App