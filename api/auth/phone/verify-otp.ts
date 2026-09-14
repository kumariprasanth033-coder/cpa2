import type { ServerResponse } from 'http';
import app from '../../../server';

export default function handler(req: any, res: ServerResponse) {
  const queryIdx = (req.url || '').indexOf('?');
  const query = queryIdx !== -1 ? req.url.slice(queryIdx) : '';
  req.url = `/api/auth/phone/verify-otp${query}`;
  return app(req, res);
}
