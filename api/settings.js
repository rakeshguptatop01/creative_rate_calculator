const fs = require('fs');
const path = require('path');

const TMP_FILE = path.join('/tmp', 'cpc_settings.json');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    try {
      if (fs.existsSync(TMP_FILE)) {
        const data = fs.readFileSync(TMP_FILE, 'utf8');
        return res.status(200).json(JSON.parse(data));
      }
    } catch (e) {
      console.warn('Could not read serverless settings file', e);
    }
    return res.status(404).json({ notFound: true });
  }

  if (req.method === 'POST') {
    try {
      let payload = req.body || {};
      if (typeof payload === 'string') {
        try { payload = JSON.parse(payload); } catch (_) {}
      }
      fs.writeFileSync(TMP_FILE, JSON.stringify(payload, null, 2), 'utf8');
      return res.status(200).json({ success: true, timestamp: Date.now() });
    } catch (e) {
      return res.status(500).json({ error: 'Failed to persist', message: e.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};