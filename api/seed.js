/* ═══════════════════════════════════════════
   /api/seed — One-time migration script
   Seeds the existing 8 movies from Blogger
   Call once with API_SECRET, then disable/delete
   ═══════════════════════════════════════════ */

const { Redis } = require('@upstash/redis');

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Original movies from the Blogger template
const SEED_MOVIES = [
  { name: 'Robinhood', url: 'https://new1.gdflix.dad/file/5cca0dd60b5f8baf' },
  { name: 'Sikandar ka Muqaddar', url: 'https://new3.gdflix.dad/file/ef2b9a7a07e7139e#' },
  { name: 'Kantara Chapter 1', url: 'https://new3.gdflix.dad/file/c5f1f0ba027476fe' },
  { name: 'raid 2', url: 'https://new3.gdflix.dad/file/e3e5e1e7d1cabb5f' },
  { name: 'Baby John', url: 'https://new3.gdflix.dad/file/d9a3a6f21d89fd05' },
  { name: 'One Piece Film Z', url: 'https://new9.gdflix.dad/file/c0c1b6efc949b3fd' },
  { name: 'Avengers Endgame', url: 'https://new3.gdflix.dad/file/c76dcf6c10df5b92' },
  { name: 'Bahubali the beginning', url: 'https://new3.gdflix.dad/file/f38f7e1f24c31c10' },
];

function generateSlug() {
  const chars = 'abcdefghijkmnpqrstuvwxyz23456789';
  let slug = '';
  for (let i = 0; i < 6; i++) {
    slug += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return slug;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Use POST method' });
  }

  const secret = req.headers['x-api-secret'] || req.headers['X-Api-Secret'];
  if (secret !== process.env.API_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Check if already seeded
    const existing = await redis.smembers('movies:slugs');
    if (existing && existing.length > 0) {
      return res.json({
        message: 'Database already has movies. Skipping seed.',
        existing: existing.length,
      });
    }

    const results = [];

    for (const movie of SEED_MOVIES) {
      const slug = generateSlug();

      await redis.hset('movie:' + slug, {
        name: movie.name,
        url: movie.url,
        created: new Date().toISOString(),
      });

      await redis.sadd('movies:slugs', slug);
      await redis.set('views:' + slug, 0);

      const host = req.headers.host || 'toolzhub.vercel.app';
      const proto = req.headers['x-forwarded-proto'] || 'https';

      results.push({
        name: movie.name,
        slug,
        link: `${proto}://${host}/go/${slug}`,
      });
    }

    return res.json({
      success: true,
      message: `Seeded ${results.length} movies`,
      movies: results,
    });
  } catch (error) {
    console.error('Seed error:', error);
    return res.status(500).json({ error: 'Seed failed: ' + error.message });
  }
};
