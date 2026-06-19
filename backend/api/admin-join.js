const { getBuzzerEnabled, getPresses, getTeams } = require('./_kv');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const [buzzerEnabled, presses, teams] = await Promise.all([
      getBuzzerEnabled(),
      getPresses(),
      getTeams(),
    ]);

    return res.status(200).json({ buzzerEnabled, presses, teams });
  } catch (err) {
    console.error('admin-join error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
