import type { ServerResponse } from 'http';
import handleRequest from './_handler';

export default function handler(req: any, res: ServerResponse) {
  if (req.url && !req.url.startsWith('/api/wallet')) {
    const queryIdx = req.url.indexOf('?');
    const query = queryIdx !== -1 ? req.url.slice(queryIdx) : '';
    req.url = `/api/wallet${query}`;
  }
  return handleRequest(req, res);
}
