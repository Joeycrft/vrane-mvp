import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(bodyParser.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Health check route
app.get('/', (req, res) => {
  res.send('Vrane backend is running!');
});

// Endpoint to estimate reading level from assessment
app.post('/api/assessment-result', async (req, res) => {
  console.log('Received /api/assessment-result request');
  try {
    const { answers, questions, passages } = req.body;
    const prompt = `
You are an expert reading assessment AI. Based on the following student's answers to a reading comprehension assessment, estimate the student's reading level as a US school grade (e.g., 4th grade, 7th grade, 10th grade, etc.). Be as accurate as possible. Only return the grade level and a one-sentence justification.

Assessment:
${questions ? `Questions: ${JSON.stringify(questions)}\n` : ''}
${passages ? `Passages: ${JSON.stringify(passages)}\n` : ''}
Answers: ${JSON.stringify(answers)}

Result:
`;

    const completion = await openai.completions.create({
      model: 'gpt-3.5-turbo-instruct',
      prompt,
      max_tokens: 60,
      temperature: 0.3,
    });

    const result = completion.choices[0].text.trim();
    console.log('OpenAI assessment result:', result);

    res.json({ analysis: result });
  } catch (error) {
    console.error('Error in /api/assessment-result:', error);
    res.status(500).json({ error: 'Error getting assessment result from OpenAI' });
  }
});

// Main AI highlight analysis endpoint
app.post('/api/highlight', async (req, res) => {
  console.log('Received /api/highlight request');
  try {
    const { text, answer, level } = req.body;
    console.log('Request body:', req.body);

    if (!text || !answer) {
      console.log('Missing required fields');
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const prompt = `
You are Vrane, an AI reading assistant for students in grades 4–12. Given the following sentence, provide a clear, direct explanation of its meaning, using simple language appropriate for a ${level || "middle school"} student. Do not mention strengths or weaknesses—just explain the sentence in a way that helps the student understand it.

Sentence: ${answer}

Explanation:
`;

    const completion = await openai.completions.create({
      model: 'gpt-3.5-turbo-instruct',
      prompt,
      max_tokens: 120,
      temperature: 0.7,
    });

    const analysis = completion.choices[0].text.trim();
    console.log('OpenAI response:', analysis);

    res.json({ analysis });
  } catch (error) {
    console.error('Error in /api/highlight:', error);
    res.status(500).json({ error: 'Error getting breakdown from OpenAI' });
  }
});

app.listen(PORT, () => {
  console.log(`Vrane backend listening on port ${PORT}`);
});