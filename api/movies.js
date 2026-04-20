/* ═══════════════════════════════════════════
   /api/movies — CRUD for movie entries
   Methods: GET (list), POST (add), DELETE (remove)
   Protected by API_SECRET header
   ═══════════════════════════════════════════ */

const { Redis } = require('@upstash/redis');

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

function generateSlug() {
  const chars = 'abcdefghijkmnpqrstuvwxyz23456789';
  let slug = '';
  for (let i = 0; i < 6; i++) {
    slug += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return slug;
}

function verifySecret(req) {
  const secret = req.headers['x-api-secret'] || req.headers['X-Api-Secret'];
  return secret === process.env.API_SECRET;
}

module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Api-Secret');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // === GET: List all movies ===
  if (req.method === 'GET') {
    if (!verifySecret(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      // Get all movie slugs from the set
      const slugs = await redis.smembers('movies:slugs');

      if (!slugs || slugs.length === 0) {
        return res.json({ movies: [], total: 0 });
      }

      // Get details for each slug
      const movies = [];
      for (const slug of slugs) {
        const data = await redis.hgetall('movie:' + slug);
        if (data && data.name) {
          const views = await redis.get('views:' + slug) || 0;
          movies.push({
            slug,
            name: data.name,
            url: data.url,
            views: parseInt(views),
            created: data.created || 'unknown',
            link: `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}/go?slug=${slug}`,
          });
        }
      }

      // Sort by views descending
      movies.sort((a, b) => b.views - a.views);

      return res.json({ movies, total: movies.length });
    } catch (error) {
      console.error('List error:', error);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  // === POST: Add a new movie ===
  if (req.method === 'POST') {
    if (!verifySecret(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const { name, url } = req.body;

      if (!name || !url) {
        return res.status(400).json({ error: 'Both "name" and "url" are required' });
      }

      // Validate URL
      try {
        new URL(url);
      } catch {
        return res.status(400).json({ error: 'Invalid URL format' });
      }

      // Generate unique slug
      let slug = generateSlug();
      let exists = await redis.exists('movie:' + slug);
      let tries = 0;
      while (exists && tries < 10) {
        slug = generateSlug();
        exists = await redis.exists('movie:' + slug);
        tries++;
      }

      // Store movie data
      await redis.hset('movie:' + slug, {
        name: name,
        url: url,
        created: new Date().toISOString(),
      });

      // Add slug to set
      await redis.sadd('movies:slugs', slug);

      // Initialize view counter
      await redis.set('views:' + slug, 0);

      const fullLink = `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}/go?slug=${slug}`;

      return res.status(201).json({
        success: true,
        slug,
        name,
        url,
        link: fullLink,
      });
    } catch (error) {
      console.error('Add error:', error);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  // === DELETE: Remove a movie ===
  if (req.method === 'DELETE') {
    if (!verifySecret(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const { slug } = req.body || {};

      if (!slug) {
        return res.status(400).json({ error: '"slug" is required' });
      }

      const exists = await redis.exists('movie:' + slug);
      if (!exists) {
        return res.status(404).json({ error: 'Movie not found' });
      }

      // Get name before deleting
      const name = await redis.hget('movie:' + slug, 'name');

      // Delete movie data, views, and remove from set
      await redis.del('movie:' + slug);
      await redis.del('views:' + slug);
      await redis.srem('movies:slugs', slug);

      return res.json({ success: true, deleted: slug, name });
    } catch (error) {
      console.error('Delete error:', error);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
