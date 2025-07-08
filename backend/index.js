console.log('Starting backend index.js...');
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3001;

require('dotenv').config();
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

app.use(cors());
app.use(express.json());

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

app.post('/api/highlight', async (req, res) => {
  const { text, question, answer, prompt } = req.body;

  if (!OPENAI_API_KEY) {
    return res.status(500).json({ analysis: 'OpenAI API key not set. Please add OPENAI_API_KEY to your .env file.' });
  }

  try {
    const completionRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a helpful reading assistant for students.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 180,
        temperature: 0.7
      })
    });
    const completionData = await completionRes.json();
    const analysis = completionData.choices && completionData.choices[0] && completionData.choices[0].message && completionData.choices[0].message.content
      ? completionData.choices[0].message.content.trim()
      : 'Sorry, I could not generate a breakdown for that text.';
    res.json({ analysis });
  } catch (err) {
    res.status(500).json({ analysis: 'Error contacting OpenAI: ' + err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
  if (!OPENAI_API_KEY) {
    console.log('WARNING: No OpenAI API key set. Please add OPENAI_API_KEY=your-key to a .env file.');
  }
});

