/* ═══════════════════════════════════════════
   /api/redirect — Public lookup for movie URL
   Called by go.html to resolve slug → movie URL
   Increments view counter on each lookup
   ═══════════════════════════════════════════ */

const { Redis } = require('@upstash/redis');

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const slug = req.query.slug;

  if (!slug || slug.length < 4 || slug.length > 10) {
    return res.status(400).json({ error: 'Invalid slug' });
  }

  try {
    const data = await redis.hgetall('movie:' + slug);

    if (!data || !data.url) {
      return res.status(404).json({ error: 'Not found' });
    }

    // Increment view counter (fire-and-forget)
    redis.incr('views:' + slug).catch(() => {});

    return res.json({
      name: data.name,
      url: data.url,
    });
  } catch (error) {
    console.error('Redirect error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};
