import type { ServerResponse } from 'http';
import handleRequest from '../../_handler';

export default function handler(req: any, res: ServerResponse) {
  // Legacy /api/cpa/auth/* is canonically handled by /api/auth/*
  return handleRequest(req, res, '/api/auth');
}
