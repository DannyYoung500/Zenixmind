import type { VercelRequest, VercelResponse } from '@vercel/node';
import fs from 'fs';
import path from 'path';

function dataDir() {
  const dir = process.env.VERCEL ? path.join('/tmp', 'zenixmind-data') : path.resolve('./data');
  try {
    fs.mkdirSync(dir, { recursive: true });
  } catch {}
  return dir;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let banners: any[] = [];
  try {
    const file = path.join(dataDir(), 'broadcasts.json');
    if (fs.existsSync(file)) {
      banners = JSON.parse(fs.readFileSync(file, 'utf8'));
    }
  } catch {}

  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json({
    activeAnnouncement: null,
    activeBanners: Array.isArray(banners) ? banners.filter((b) => b && b.active) : []
  });
}
