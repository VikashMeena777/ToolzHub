/* ═══════════════════════════════════════════
   /api/stats — View statistics
   Returns total movies, total views, top movies
   Protected by API_SECRET
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

  const secret = req.headers['x-api-secret'] || req.headers['X-Api-Secret'];
  if (secret !== process.env.API_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const slugs = await redis.smembers('movies:slugs');
    let totalViews = 0;
    const movieStats = [];

    for (const slug of (slugs || [])) {
      const name = await redis.hget('movie:' + slug, 'name');
      const views = parseInt(await redis.get('views:' + slug) || '0');
      totalViews += views;

      if (name) {
        movieStats.push({ slug, name, views });
      }
    }

    // Sort by views descending (top performers first)
    movieStats.sort((a, b) => b.views - a.views);

    return res.json({
      totalMovies: movieStats.length,
      totalViews,
      topMovies: movieStats.slice(0, 10),
      allMovies: movieStats,
    });
  } catch (error) {
    console.error('Stats error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};
