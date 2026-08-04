import { NextApiRequest, NextApiResponse } from 'next';

export const setAPIRouteHeaders = (
  res: NextApiResponse,
  allowedMethods: string,
  req?: NextApiRequest
) => {
  const allowedOrigin = process.env.PUBLIC_URL || '';
  const origin = req?.headers?.origin;

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader(
    'Access-Control-Allow-Origin',
    origin && origin === allowedOrigin ? allowedOrigin : ''
  );
  res.setHeader('Access-Control-Allow-Methods', allowedMethods);
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );
};
