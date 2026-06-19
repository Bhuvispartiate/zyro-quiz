const { Redis } = require('@upstash/redis');

// @upstash/redis uses environment variables automatically:
//   UPSTASH_REDIS_REST_URL
//   UPSTASH_REDIS_REST_TOKEN
// These are set automatically when you connect an Upstash Redis store in the Vercel dashboard.
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const KEYS = {
  BUZZER_ENABLED: 'buzzer:enabled',
  BUZZER_PRESSES: 'buzzer:presses',
  TEAMS: 'buzzer:teams',
};

async function getBuzzerEnabled() {
  const val = await redis.get(KEYS.BUZZER_ENABLED);
  // Default to true if not set
  return val === null ? true : Boolean(val);
}

async function setBuzzerEnabled(val) {
  await redis.set(KEYS.BUZZER_ENABLED, val);
}

async function getPresses() {
  const val = await redis.get(KEYS.BUZZER_PRESSES);
  return Array.isArray(val) ? val : [];
}

async function setPresses(presses) {
  await redis.set(KEYS.BUZZER_PRESSES, presses);
}

async function getTeams() {
  const val = await redis.get(KEYS.TEAMS);
  return Array.isArray(val) ? val : [];
}

async function addTeam(teamName) {
  const teams = await getTeams();
  if (!teams.includes(teamName)) {
    teams.push(teamName);
    await redis.set(KEYS.TEAMS, teams);
  }
  return teams;
}

async function removeTeam(teamName) {
  const teams = await getTeams();
  const filtered = teams.filter((t) => t !== teamName);
  await redis.set(KEYS.TEAMS, filtered);
  return filtered;
}

module.exports = {
  getBuzzerEnabled,
  setBuzzerEnabled,
  getPresses,
  setPresses,
  getTeams,
  addTeam,
  removeTeam,
};
