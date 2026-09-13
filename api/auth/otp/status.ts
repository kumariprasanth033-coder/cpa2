import type { ServerResponse } from 'http';
import app from '../../../server';

export default function handler(req: any, res: ServerResponse) {
  req.url = '/api/auth/otp/status';
  return app(req, res);
}
