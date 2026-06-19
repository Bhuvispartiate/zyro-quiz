const pusher = require('./_pusher');
const { getBuzzerEnabled, addTeam, getPresses } = require('./_kv');

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
    const { teamName } = req.body;
    const cleanName = (teamName || '').trim();

    if (!cleanName) {
      return res.status(400).json({ error: 'Team name cannot be empty.' });
    }

    // Check for duplicate team names (case-insensitive)
    const { getTeams } = require('./_kv');
    const currentTeams = await getTeams();
    const isDuplicate = currentTeams.some(
      (t) => t.toLowerCase() === cleanName.toLowerCase()
    );

    if (isDuplicate) {
      return res
        .status(409)
        .json({ error: 'This team name is already taken. Please choose another.' });
    }

    // Add team to KV store
    const updatedTeams = await addTeam(cleanName);

    // Get current buzzer state
    const buzzerEnabled = await getBuzzerEnabled();

    // Get current presses
    const presses = await getPresses();

    // Broadcast updated teams list to all clients
    await pusher.trigger('quiz', 'teams-update', updatedTeams);

    // Send join success back (only the joining client needs this — done via HTTP response)
    return res.status(200).json({
      success: true,
      teamName: cleanName,
      buzzerEnabled,
      presses,
    });
  } catch (err) {
    console.error('join error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
