import type { ServerResponse } from 'http';
import app from '../../server';

export default function handler(req: any, res: ServerResponse) {
  req.url = '/api/auth/send-otp';
  return app(req, res);
}
