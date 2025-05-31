import express from 'express';
import cors from 'cors';
import statsRoute from './routes/stats.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('🏀 HoopsHub backend is live!');
  });  

// Routes
app.use('/api/stats', statsRoute);

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
