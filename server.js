import express from 'express';
import cors from 'cors';
import statsRoute from './routes/stats.js';
import authRoute from './routes/auth.js';
import pool from './db.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/auth', authRoute);

// Optional: Log all incoming requests
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

// Default health check route
app.get('/', (req, res) => {
  res.send('🏀 HoopsHub backend is live!');
});

// Mount stats route
app.use('/api/stats', statsRoute);

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
