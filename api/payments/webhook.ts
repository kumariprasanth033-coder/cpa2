import type { ServerResponse } from 'http';
import app from '../../server';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default function handler(req: any, res: ServerResponse) {
  const queryIdx = (req.url || '').indexOf('?');
  const qs = queryIdx !== -1 ? req.url.slice(queryIdx) : '';
  req.url = '/api/payments/webhook' + qs;
  return app(req, res);
}
