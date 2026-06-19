const pusher = require('./_pusher');
const { setBuzzerEnabled } = require('./_kv');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { enabled } = req.body;
    const val = Boolean(enabled);

    await setBuzzerEnabled(val);

    // Broadcast to all clients
    await pusher.trigger('quiz', 'buzzer-state', val);

    return res.status(200).json({ success: true, buzzerEnabled: val });
  } catch (err) {
    console.error('toggle error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
