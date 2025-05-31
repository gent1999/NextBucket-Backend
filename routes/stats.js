import express from 'express';
import axios from 'axios';
import cheerio from 'cheerio';

const router = express.Router();

router.post('/', async (req, res) => {
  const { name, college } = req.body;

  try {
    const searchQuery = `${name} ${college} site:sports-reference.com/cbb`;
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;

    const headers = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    };

    // Step 1: Search Google for the player's Sports Reference page
    const { data: searchHtml } = await axios.get(searchUrl, { headers });
    const $ = cheerio.load(searchHtml);
    const href = $('a')
      .map((i, el) => $(el).attr('href'))
      .get()
      .find(h => h.includes('/cbb/players/'));

    if (!href) {
      return res.status(404).json({ error: 'Player page not found.' });
    }

    // Extract actual player URL
    const match = href.match(/\/url\?q=(https:\/\/www\.sports-reference\.com\/cbb\/players\/[^&]+)/);
    const playerUrl = match ? match[1] : null;

    if (!playerUrl) {
      return res.status(404).json({ error: 'Player link could not be resolved.' });
    }

    console.log(`🔎 Found player page: ${playerUrl}`);

    // Step 2: Scrape stats from the player's page
    const { data: playerHtml } = await axios.get(playerUrl, { headers });
    const $$ = cheerio.load(playerHtml);

    const table = $$('table#players_per_game');
    const lastRow = table.find('tbody tr').last();

    const ppg = lastRow.find('td[data-stat="pts_per_g"]').text() || 'N/A';
    const rpg = lastRow.find('td[data-stat="trb_per_g"]').text() || 'N/A';
    const apg = lastRow.find('td[data-stat="ast_per_g"]').text() || 'N/A';

    return res.json({
      name,
      college,
      pointsPerGame: ppg,
      reboundsPerGame: rpg,
      assistsPerGame: apg,
    });
  } catch (err) {
    console.error('❌ Scrape failed:', err.message);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export default router;
