import express from 'express';
import cors from 'cors';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend DDD-Lite running' });
});

app.listen(port, () => {
  console.log(`🚀 Backend running at http://localhost:${port}`);
});
