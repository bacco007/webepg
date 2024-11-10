import type { NextApiRequest, NextApiResponse } from 'next';

import { getCookie, setCookie } from '@/lib/cookies';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const existingCookie = await getCookie('example');
  await setCookie('example', 'new value');

  res.status(200).json({ message: 'Cookie updated' });
}
