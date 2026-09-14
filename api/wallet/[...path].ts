import type { ServerResponse } from 'http';
import handleRequest from '../_handler';

export default function handler(req: any, res: ServerResponse) {
  return handleRequest(req, res, '/api/wallet');
}
