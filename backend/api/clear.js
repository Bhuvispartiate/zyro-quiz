const pusher = require('./_pusher');
const { setPresses } = require('./_kv');

module.exports = async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await setPresses([]);

    // Broadcast empty presses list — teams will reset their buzzer state
    await pusher.trigger('quiz', 'presses-update', []);

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('clear error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
