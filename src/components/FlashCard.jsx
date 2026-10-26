import { useState } from 'react'

function FlashCard({ card }) {
  const [flipped, setFlipped] = useState(false)

  return (
    <div className="flip-card" onClick={() => setFlipped(f => !f)} role="button" tabIndex={0}
      onKeyDown={e => e.key === 'Enter' || e.key === ' ' ? setFlipped(f => !f) : null}>
      <div className={`flip-card-inner${flipped ? ' flipped' : ''}`}>
        <div className="flip-card-face flip-card-front">
          <span className="card-label">Question</span>
          <p className="card-text">{card.front}</p>
        </div>
        <div className="flip-card-face flip-card-back">
          <span className="card-label">Answer</span>
          <p className="card-text">{card.back}</p>
        </div>
      </div>
    </div>
  )
}

export default FlashCard