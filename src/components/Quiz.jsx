import { useState } from 'react'

function Quiz({ cards, onExit }) {
  const [deck, setDeck]           = useState(cards)
  const [index, setIndex]         = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [wrong, setWrong]         = useState([])
  const [correct, setCorrect]     = useState(0)
  const [done, setDone]           = useState(false)
  const [round, setRound]         = useState(1)

  const current = deck[index]

  function handleAnswer(isCorrect) {
    const newWrong   = isCorrect ? wrong : [...wrong, current]
    const newCorrect = isCorrect ? correct + 1 : correct

    if (index + 1 < deck.length) {
      setCorrect(newCorrect)
      setWrong(newWrong)
      setIndex(index + 1)
      setShowAnswer(false)
    } else {
      if (newWrong.length > 0) {
        setDeck(newWrong)
        setIndex(0)
        setWrong([])
        setCorrect(0)
        setShowAnswer(false)
        setRound(r => r + 1)
      } else {
        setCorrect(newCorrect)
        setDone(true)
      }
    }
  }

  const pct = Math.round((correct / deck.length) * 100)

  if (done) {
    return (
      <div className="quiz-section">
        <div className="quiz-done">
          <div className="quiz-done-icon">
            {pct === 100 ? '🎉' : pct >= 60 ? '👍' : '📖'}
          </div>
          <h2>Quiz Complete</h2>
          <div className="score-text">{correct}/{deck.length}</div>
          <p>
            {pct === 100
              ? 'Perfect score — you nailed every card!'
              : `Round ${round} · ${pct}% correct. Keep going!`}
          </p>
          <button className="btn-generate" style={{ marginTop: '0.5rem' }} onClick={onExit}>
            ← Back to Flashcards
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="quiz-section">

      {round > 1 && (
        <div className="quiz-round-tag">
          Round {round} — re-testing {deck.length} {deck.length === 1 ? 'card' : 'cards'}
        </div>
      )}

      <div className="counter-row" style={{ maxWidth: 580 }}>
        <span className="card-counter">Card {index + 1} of {deck.length}</span>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: ((index + 1) / deck.length * 100) + '%' }} />
        </div>
      </div>

      <div className="quiz-question-card">
        <h3>Question</h3>
        <p>{current.front}</p>
      </div>

      {!showAnswer ? (
        <button className="btn-reveal" onClick={() => setShowAnswer(true)}>
          Reveal Answer
        </button>
      ) : (
        <>
          <div className="quiz-answer-card">
            <h3>Answer</h3>
            <p>{current.back}</p>
          </div>
          <div className="quiz-actions">
            <button className="btn-correct" onClick={() => handleAnswer(true)}>
              ✓ Got it
            </button>
            <button className="btn-wrong" onClick={() => handleAnswer(false)}>
              ↩ Review again
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default Quiz