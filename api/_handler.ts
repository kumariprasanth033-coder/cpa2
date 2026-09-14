import type { ServerResponse } from 'http';
import app from '../server';

export default function handleRequest(req: any, res: ServerResponse, explicitRoutePrefix?: string) {
  // 1. Normalize duplicate /api/api/ path prefixes
  if (typeof req.url === 'string' && req.url.startsWith('/api/api/')) {
    req.url = req.url.replace(/^\/api\/api\//, '/api/');
  }

  // 2. Check if Vercel serverless passed query path segments (from [...path] or rewrite)
  const pathSegments = req.query?.path || req.query?.all;
  if (pathSegments) {
    const subpath = Array.isArray(pathSegments) ? pathSegments.join('/') : String(pathSegments);
    const queryIdx = (req.url || '').indexOf('?');
    const queryString = queryIdx !== -1 ? req.url.slice(queryIdx) : '';

    // Strip internal routing query parameters ('path' and 'all')
    let cleanQuery = '';
    if (queryString) {
      try {
        const sp = new URLSearchParams(queryString.startsWith('?') ? queryString.slice(1) : queryString);
        sp.delete('path');
        sp.delete('all');
        const spStr = sp.toString();
        cleanQuery = spStr ? `?${spStr}` : '';
      } catch {
        cleanQuery = queryString;
      }
    }

    const prefix = explicitRoutePrefix ? explicitRoutePrefix.replace(/\/+$/, '') : '/api';
    const cleanSub = subpath.replace(/^\/+/, '');
    req.url = `${prefix}/${cleanSub}${cleanQuery}`;
  } else {
    // 3. Fallback to matched Vercel headers if req.url was rewritten
    const originalPath =
      req.headers?.['x-vercel-matched-path'] ||
      req.headers?.['x-matched-path'] ||
      req.headers?.['x-forwarded-uri'] ||
      req.headers?.['x-original-url'];

    if (originalPath && typeof originalPath === 'string' && originalPath.startsWith('/api') && originalPath !== '/api') {
      const queryIdx = (req.url || '').indexOf('?');
      const queryString = queryIdx !== -1 && !originalPath.includes('?') ? req.url.slice(queryIdx) : '';
      req.url = originalPath + queryString;
    } else if (req.url && !req.url.startsWith('/api')) {
      req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
    }
  }

  // Final check for /api/api/
  if (typeof req.url === 'string' && req.url.startsWith('/api/api/')) {
    req.url = req.url.replace(/^\/api\/api\//, '/api/');
  }

  return app(req, res);
}
