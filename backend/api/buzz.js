const pusher = require('./_pusher');
const { getBuzzerEnabled, getPresses, setPresses } = require('./_kv');

module.exports = async function handler(req, res) {
try {
  // Set CORS headers safely
  res.setHeader('Access-Control-Allow-Credentials', 'true');
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
    const { teamName } = req.body;
    if (!teamName) {
      return res.status(400).json({ error: 'teamName required' });
    }

    const buzzerEnabled = await getBuzzerEnabled();
    if (!buzzerEnabled) {
      return res.status(403).json({ error: 'Buzzer is disabled' });
    }

    const now = new Date();
    const entry = {
      teamName,
      timestamp: now.toISOString(),
      displayTime: now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        fractionalSecondDigits: 3,
        hour12: true,
      }),
    };

    // Append and sort by timestamp
    const presses = await getPresses();
    presses.push(entry);
    presses.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    await setPresses(presses);

    // Broadcast updated presses to all clients (admin sees full list)
    await pusher.trigger('quiz', 'presses-update', presses);

    // Return the confirmed entry (the client uses this to show confirmation)
    return res.status(200).json({ success: true, entry });
  } catch (err) {
    console.error('buzz error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

} catch (globalErr) { return res.status(500).json({ error: globalErr.message, stack: globalErr.stack, source: 'global_catch' }); }
