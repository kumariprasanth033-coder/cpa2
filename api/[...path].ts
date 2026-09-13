import type { ServerResponse } from 'http';
import app from '../server';

export default function handler(req: any, res: ServerResponse) {
  // If Vercel URL rewrite altered the path, restore original API route path
  const originalPath =
    req.headers?.['x-vercel-matched-path'] ||
    req.headers?.['x-matched-path'] ||
    req.headers?.['x-forwarded-uri'] ||
    req.headers?.['x-original-url'];

  if (originalPath && typeof originalPath === 'string' && originalPath.startsWith('/api')) {
    const queryIdx = (req.url || '').indexOf('?');
    const queryString = queryIdx !== -1 && !originalPath.includes('?') ? req.url.slice(queryIdx) : '';
    req.url = originalPath + queryString;
  } else if (req.url && !req.url.startsWith('/api')) {
    req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
  }

  return app(req, res);
}
