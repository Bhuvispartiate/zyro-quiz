const pusher = require('./_pusher');
const { removeTeam } = require('./_kv');

module.exports = async function handler(req, res) {
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
