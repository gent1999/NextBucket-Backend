// routes/stats.js
import express from 'express';
import axios from 'axios';
import * as cheerio from 'cheerio';

const router = express.Router();

// Attempt Sports Reference scraping
const fetchFromSportsReference = async (name, college) => {
  const query = `${name} ${college} site:sports-reference.com/cbb/players`;
  const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
  const headers = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  };

  const { data: searchHtml } = await axios.get(searchUrl, { headers });
  const $ = cheerio.load(searchHtml);

  const link = $('a')
    .map((i, el) => $(el).attr('href'))
    .get()
    .find(h => h.includes('sports-reference.com/cbb/players'));

  const match = link?.match(/\/url\?q=(https:\/\/www\.sports-reference\.com\/cbb\/players\/[^&]+)/);
  const playerUrl = match ? match[1] : null;

  if (!playerUrl) throw new Error('Player not found on Sports Reference.');

  const { data: playerHtml } = await axios.get(playerUrl, { headers });
  const $$ = cheerio.load(playerHtml);
  const row = $$('table#players_per_game tbody tr').last();

  return {
    name,
    college,
    pointsPerGame: row.find('td[data-stat="pts_per_g"]').text() || 'N/A',
    reboundsPerGame: row.find('td[data-stat="trb_per_g"]').text() || 'N/A',
    assistsPerGame: row.find('td[data-stat="ast_per_g"]').text() || 'N/A',
    source: playerUrl,
  };
};

// Attempt ESPN scraping
const fetchFromESPN = async (name, college) => {
  const query = `${name} ${college} site:espn.com/mens-college-basketball/player`;
  const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
  const headers = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  };

  const { data: searchHtml } = await axios.get(searchUrl, { headers });
  const $ = cheerio.load(searchHtml);

  const link = $('a')
    .map((i, el) => $(el).attr('href'))
    .get()
    .find(h => h.includes('/mens-college-basketball/player/_/id/'));

  const match = link?.match(/\/url\?q=(https:\/\/www\.espn\.com\/mens-college-basketball\/player\/[^&]+)/);
  const playerUrl = match ? match[1] : null;

  if (!playerUrl) throw new Error('Player not found on ESPN.');

  const { data: playerHtml } = await axios.get(playerUrl, { headers });
  const $$ = cheerio.load(playerHtml);
  const rows = $$('table tbody tr');
  const lastRow = rows.last();
  const cells = lastRow.find('td');

  return {
    name,
    college,
    pointsPerGame: cells.eq(1).text() || 'N/A',
    reboundsPerGame: cells.eq(4).text() || 'N/A',
    assistsPerGame: cells.eq(5).text() || 'N/A',
    source: playerUrl,
  };
};

// Placeholder for future sites (e.g. StatMuse, NCAA.com, etc.)
const fetchFromOtherSources = async (name, college) => {
  throw new Error('No more sources available.');
};

router.post('/', async (req, res) => {
  const { name, college } = req.body;

  try {
    let stats;

    try {
      stats = await fetchFromSportsReference(name, college);
      console.log('✅ Found via Sports Reference');
    } catch (err1) {
      console.warn('⚠️ Sports Reference failed:', err1.message);
      try {
        stats = await fetchFromESPN(name, college);
        console.log('✅ Found via ESPN');
      } catch (err2) {
        console.warn('⚠️ ESPN failed:', err2.message);
        try {
          stats = await fetchFromOtherSources(name, college);
        } catch (err3) {
          console.error('❌ All sources failed:', err3.message);
          return res.status(404).json({ error: 'Player stats not found from any source.' });
        }
      }
    }

    res.json(stats);
  } catch (err) {
    console.error('❌ Stats fetch failed:', err.message);
    res.status(500).json({ error: 'Unexpected error fetching stats.' });
  }
});

export default router;
