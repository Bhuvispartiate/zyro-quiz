const pusher = require('./_pusher');
const { removeTeam } = require('./_kv');

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

    const updatedTeams = await removeTeam(teamName);

    // Broadcast updated teams list
    await pusher.trigger('quiz', 'teams-update', updatedTeams);

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('disconnect error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

} catch (globalErr) { return res.status(500).json({ error: globalErr.message, stack: globalErr.stack, source: 'global_catch' }); }
