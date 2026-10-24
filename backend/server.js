require('dotenv').config({ path: 'backend/.env' })

const express = require('express')
const cors = require('cors')

const app = express()
app.use(express.json())

// In production, ALLOWED_ORIGIN is set to the Vercel frontend URL
const allowedOrigin = process.env.ALLOWED_ORIGIN || 'http://localhost:5173'
app.use(cors({ origin: allowedOrigin }))

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

const SYSTEM_PROMPT = 'You are a study assistant. The user gives you notes or a topic. Return ONLY a valid JSON object, no markdown, no code fences, no explanation. The JSON must follow this exact shape: {"title":"short topic title","flashcards":[{"id":1,"front":"question or term","back":"answer or definition"}]}. Generate 5 to 8 flashcards. Return ONLY the JSON.'

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