import { useState } from 'react'

function Quiz({ cards, onExit }) {
  const [deck, setDeck] = useState(cards)
  const [index, setIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [wrong, setWrong] = useState([])
  const [correct, setCorrect] = useState(0)
  const [done, setDone] = useState(false)
  const [round, setRound] = useState(1)

  const current = deck[index]

  function handleAnswer(isCorrect) {
    const newWrong = isCorrect ? wrong : [...wrong, current]
    const newCorrect = isCorrect ? correct + 1 : correct

    if (index + 1 < deck.length) {
      setCorrect(newCorrect)
      setWrong(newWrong)
      setIndex(index + 1)
      setShowAnswer(false)
    } else {
      if (newWrong.length > 0) {
        // Re-test wrong cards in a new round
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

  if (done) {
    return (
      <div className="quiz-section">
        <div className="quiz-done">
          <h2>Quiz Complete!</h2>
          <div className="score">{correct}/{deck.length}</div>
          <p>Round {round} — {correct} of {deck.length} correct.</p>
          <button className="btn-primary" onClick={onExit}>Back to Flashcards</button>
        </div>
      </div>
    )
  }

  return (
    <div className="quiz-section">
      {round > 1 && (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Round {round} — re-testing {deck.length} wrong {deck.length === 1 ? 'card' : 'cards'}
        </p>
      )}

      <p className="card-counter">Card {index + 1} of {deck.length}</p>

      <div className="progress-bar" style={{ width: '100%', maxWidth: '560px' }}>
        <div className="progress-fill" style={{ width: ((index + 1) / deck.length * 100) + '%' }} />
      </div>

      <div className="quiz-question-card">
        <h3>Question</h3>
        <p>{current.front}</p>
      </div>

      {!showAnswer ? (
        <button className="btn-show-answer" onClick={() => setShowAnswer(true)}>
          Show Answer
        </button>
      ) : (
        <>
          <div className="quiz-answer-card">
            <h3>Answer</h3>
            <p>{current.back}</p>
          </div>
          <div className="quiz-actions">
            <button className="btn-correct" onClick={() => handleAnswer(true)}>Got it</button>
            <button className="btn-wrong" onClick={() => handleAnswer(false)}>Review again</button>
          </div>
        </>
      )}
    </div>
  )
}

export default Quiz