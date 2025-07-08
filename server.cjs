const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 5001;

app.use(cors());
app.use(express.json());

app.post('/api/breakdown', async (req, res) => {
  const { text, level } = req.body;
  // Placeholder for OpenAI integration
  res.json({ breakdown: `This is a breakdown of: "${text}" for level: ${level}` });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});