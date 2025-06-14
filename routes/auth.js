import express from 'express';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import dotenv from 'dotenv';
import pool from '../db.js'; // adjust path if your db file is elsewhere

dotenv.config();

const router = express.Router();
const SECRET_KEY = process.env.JWT_SECRET;

// JWT generator
const generateToken = (user) => {
  return jwt.sign(
    {
      email: user.email,
      name: user.name,
    },
    SECRET_KEY,
    { expiresIn: '7d' }
  );
};

// Google OAuth login route
router.post('/googlelogin', async (req, res) => {
  console.log('🌐 Google login route hit');
  const { access_token } = req.body;

  try {
    // Step 1: Verify the token
    const tokenInfoUrl = `https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${access_token}`;
    const { data } = await axios(tokenInfoUrl);

    if (data.aud !== process.env.GOOGLE_CLIENT_ID) {
      return res.status(401).json({ message: 'Unauthorized client ID' });
    }

    // Step 2: Get user info
    const userInfoUrl = 'https://www.googleapis.com/oauth2/v3/userinfo';
    const userInfoRes = await axios.get(userInfoUrl, {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const email = userInfoRes.data.email;
    const name = email.split('@')[0];

    // Step 3: Check if user exists
    const existingUserQuery = 'SELECT * FROM users WHERE email = $1';
    const existingUserResult = await pool.query(existingUserQuery, [email]);

    if (existingUserResult.rowCount === 0) {
      // Step 4: Insert new user
      const insertQuery = 'INSERT INTO users (email, name) VALUES ($1, $2)';
      await pool.query(insertQuery, [email, name]);
      console.log(`🆕 Inserted new user: ${email}`);
    }

    // Step 5: Return JWT
    const token = generateToken({ email, name });
    res.status(200).json({ token, user: { email, name } });

  } catch (error) {
    console.error('❌ Error during Google login:', error.message);
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
});

export default router;
