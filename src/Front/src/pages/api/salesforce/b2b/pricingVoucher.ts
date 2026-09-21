import crypto from 'crypto';
import { NextApiRequest, NextApiResponse } from 'next';
import {
  fetchAccountDataFromMulesoft,
  getAuthorizedBuyerAccountIds,
  setAPIRouteHeaders,
  validateApiRequest,
} from 'utils/index';

const VOUCHER_TTL_SECONDS = 15 * 60;

const base64UrlEncode = (input: Buffer | string): string =>
  Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

export default async function pricingVoucher(req: NextApiRequest, res: NextApiResponse) {
  setAPIRouteHeaders(res, 'POST', req);

  const identity = await validateApiRequest(req, res);
  if (!identity) return;

  const { externalID, email } = identity;
  const { accountId } = req.body ?? {};

  if (!accountId || typeof accountId !== 'string') {
    return res.status(400).send({ error: 'accountId is required' });
  }

  const secret = process.env.AUTHORIZED_BUYER_PRICING_SIGNING_SECRET;
  if (!secret) {
    console.error('[pricingVoucher] AUTHORIZED_BUYER_PRICING_SIGNING_SECRET is not configured');
    return res.status(500).send({ error: 'Pricing voucher signing is not configured' });
  }

  try {
    const accountData = await fetchAccountDataFromMulesoft(externalID, email);
    const relations = accountData?.data?.salesforceGetAccountData?.accountContactRelations ?? [];

    const authorizedAccountIds = getAuthorizedBuyerAccountIds(relations);
    if (!authorizedAccountIds.includes(accountId)) {
      return res.status(403).send({ error: 'Not an authorized buyer for this account' });
    }

    const relation = relations.find((accountRelation) => accountRelation.accountId === accountId);
    const categoryPricing = (relation?.pricingTiers ?? []).map(
      ({ productCategory, discountTier, discountPercent }) => ({
        productCategory,
        discountTier,
        discountPercent,
      })
    );

    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + VOUCHER_TTL_SECONDS;

    const encodedPayload = base64UrlEncode(
      JSON.stringify({
        v: 1,
        accountId,
        externalID,
        categoryPricing,
        companyName: relation?.accountName || undefined,
        iat,
        exp,
      })
    );
    const signature = base64UrlEncode(
      crypto.createHmac('sha256', secret).update(encodedPayload).digest()
    );

    return res.status(200).send({ voucher: `${encodedPayload}.${signature}`, exp });
  } catch (error) {
    console.error('Error while minting authorized-buyer pricing voucher', error);
    return res.status(500).send({ error: 'Error while minting pricing voucher.' });
  }
}
