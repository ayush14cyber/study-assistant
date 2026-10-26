require('dotenv').config({ path: 'backend/.env' })

const express = require('express')
const cors = require('cors')

const app = express()
app.use(express.json())

// In production, ALLOWED_ORIGIN is set to the Vercel frontend URL
const allowedOrigin = process.env.ALLOWED_ORIGIN || 'http://localhost:5173'
app.use(cors({ origin: allowedOrigin }))

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

const SYSTEM_PROMPT = `You are a study assistant. The user gives you notes or a topic.
IMPORTANT: First decide whether the input is meaningful enough to study from.
If the input is gibberish, random characters, keyboard mashing, random letter sequences, completely unrecognisable nonsense, or contains no real words or recognisable concepts in any language, return EXACTLY this JSON and nothing else:
{"invalid":true}
If the input IS meaningful (real words, a real topic, real notes — even brief ones), return ONLY a valid JSON object with this exact shape:
{"title":"short topic title","flashcards":[{"id":1,"front":"question or term","back":"answer or definition"}]}
Generate 5 to 8 flashcards. No markdown, no code fences, no explanation. Return ONLY the JSON.`

// Fast local heuristic: detects obvious gibberish before wasting an API call.
// Checks vowel ratio and average word length — real language has ~30-45% vowels
// and most words are 2-12 chars. Pure keyboard mashing fails both.
function looksLikeGibberish(text) {
  const words = text.trim().split(/\s+/)
  // If it's a single long token with almost no vowels, it's gibberish
  if (words.length === 1) {
    const word = words[0]
    if (word.length < 3) return false // too short to judge
    const vowels = (word.match(/[aeiouAEIOU]/g) || []).length
    const vowelRatio = vowels / word.length
    return word.length > 6 && vowelRatio < 0.15
  }
  // Multi-word: check average vowel ratio across all words
  const allChars = words.join('')
  if (allChars.length < 4) return false
  const vowels = (allChars.match(/[aeiouAEIOU]/g) || []).length
  const vowelRatio = vowels / allChars.length
  const avgWordLen = allChars.length / words.length
  // Gibberish typically has < 10% vowels AND very long average word length
  return vowelRatio < 0.10 && avgWordLen > 7
}

// Extract JSON even if the AI wraps it in markdown code fences
function extractJSON(text) {
  try { return JSON.parse(text) } catch {}

  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenceMatch) return JSON.parse(fenceMatch[1].trim())

  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start !== -1 && end !== -1) return JSON.parse(text.slice(start, end + 1))

  throw new Error('Could not extract JSON from AI response')
}

app.post('/api/generate', async (req, res) => {
  const { text } = req.body

  if (!text || text.trim().length === 0) {
    return res.status(400).json({ error: 'Please provide some text or a topic.' })
  }

  // Fast local gibberish check — catches obvious keyboard mashing instantly
  if (looksLikeGibberish(text)) {
    return res.status(400).json({ error: 'The input does not appear to be meaningful text. Please enter a real topic or paste your notes.' })
  }

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + process.env.GROQ_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-120b',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: text.trim() }
        ],
        temperature: 0.6
      })
    })

    if (!response.ok) {
      const errText = await response.text()
      throw new Error('Groq API error ' + response.status + ': ' + errText)
    }

    const groqData = await response.json()
    const content = groqData.choices && groqData.choices[0] && groqData.choices[0].message && groqData.choices[0].message.content

    if (!content) throw new Error('Empty response from AI.')

    let parsed
    try {
      parsed = extractJSON(content)
    } catch {
      throw new Error('AI returned malformed JSON. Please try again.')
    }

    // AI-layer gibberish detection: model returns {"invalid":true} for nonsense input
    if (parsed.invalid === true) {
      return res.status(400).json({ error: 'The input does not seem to be meaningful text. Please enter a real topic, a subject name, or paste your actual notes.' })
    }

    if (!Array.isArray(parsed.flashcards) || parsed.flashcards.length === 0) {
      throw new Error('AI response had unexpected shape. Please try again.')
    }

    res.json(parsed)
  } catch (err) {
    console.error('Error:', err.message)
    res.status(500).json({ error: err.message || 'Something went wrong.' })
  }
})

// Health check for Render
app.get('/health', (req, res) => res.json({ status: 'ok' }))

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log('Backend running on http://localhost:' + PORT))