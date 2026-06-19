const pusher = require('./_pusher');
const { setPresses } = require('./_kv');

module.exports = async function handler(req, res) {
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
