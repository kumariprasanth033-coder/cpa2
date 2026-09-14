import type { ServerResponse } from 'http';
import app from '../server';

export default function handler(req: any, res: ServerResponse) {
  // If Vercel passed catch-all path segments in query (e.g. req.query.path = ['payments', 'status'])
  const pathSegments = req.query?.path;
  if (pathSegments) {
    const subpath = Array.isArray(pathSegments) ? pathSegments.join('/') : String(pathSegments);
    const queryIdx = (req.url || '').indexOf('?');
    const queryString = queryIdx !== -1 ? req.url.slice(queryIdx) : '';
    req.url = `/api/${subpath}${queryString}`;
  } else {
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
  }

  return app(req, res);
}
