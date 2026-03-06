import express from 'express';

const app = express();
const PORT = process.env.BACKEND_PORT || 3000;

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
