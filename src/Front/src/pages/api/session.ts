import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../pages/api/auth/[...nextauth]';
import { setAPIRouteHeaders } from 'utils/apiUtils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const session = await getServerSession(req, res, authOptions);
  setAPIRouteHeaders(res, 'GET,DELETE,PATCH,POST,PUT');
  return res.status(200).send({ session: session });
}
