import { useState } from "react"

function FlashCard({ card }) {
  const [flipped, setFlipped] = useState(false)

  const cls = flipped ? "flip-card-inner flipped" : "flip-card-inner"

  return (
    <div className="flip-card" onClick={() => setFlipped(!flipped)}>
      <div className={cls}>
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