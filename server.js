import express from 'express';
import cors from 'cors';
import statsRoute from './routes/stats.js';
import authRoute from './routes/auth.js';
import pool from './db.js';

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
}));

app.use(express.json());
app.use('/auth', authRoute);

app.use((req, res, next) => {
  console.log(`🛰️  ${req.method} ${req.url}`);
  next();
});

app.get('/api/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json(result.rows[0]);
  } catch (err) {
    console.error('DB test error:', err.message);
    res.status(500).json({ error: 'Database connection failed' });
  }
});

app.get('/', (req, res) => {
  res.send('🏀 HoopsHub backend is live!');
});

app.use('/api/stats', statsRoute);

// ✅ Only for local dev:
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
  });
}

// ✅ Vercel needs this
export default app;
