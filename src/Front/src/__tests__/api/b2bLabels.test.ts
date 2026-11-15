import type { NextApiRequest, NextApiResponse } from 'next';

import b2bLabels from '../../pages/api/b2bLabels';
import { handledApiPreamble, postSitecoreGraphQL } from 'utils/sitecoreApiRoute';

jest.mock('utils/sitecoreApiRoute', () => ({
  handledApiPreamble: jest.fn(),
  postSitecoreGraphQL: jest.fn(),
}));

const mockPreamble = handledApiPreamble as jest.Mock;
const mockGraphQL = postSitecoreGraphQL as jest.Mock;

const makeRes = () => {
  const res = { setHeader: jest.fn(), status: jest.fn(), json: jest.fn() };
  res.status.mockReturnValue(res);
  return res;
};

const run = async () => {
  const res = makeRes();
  await b2bLabels({} as NextApiRequest, res as unknown as NextApiResponse);
  return res;
};

const respondWith = (results: unknown[]) =>
  mockGraphQL.mockResolvedValue({
    data: { data: { b2bLabels: { children: { results } }, productMessageModal: null } },
  });

beforeEach(() => {
  mockPreamble.mockReturnValue(false);
});

describe('/api/b2bLabels shopperContext group', () => {
  it('surfaces the authored Post-Selection Redirect Link as postSelectionLinkUrl', async () => {
    respondWith([
      {
        name: 'Shopper Context',
        labels: null,
        productLink: null,
        postSelectionLink: { url: '/b2b-product-categories' },
      },
    ]);

    const res = await run();

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json.mock.calls[0][0].shopperContext).toEqual({
      postSelectionLinkUrl: '/b2b-product-categories',
    });
  });

  it('leaves the group without a URL when the link is unauthored or empty', async () => {
    respondWith([
      { name: 'Shopper Context', labels: null, productLink: null, postSelectionLink: null },
      { name: 'Cart', labels: { value: 'a=1' }, productLink: null, postSelectionLink: { url: '' } },
    ]);

    const body = (await run()).json.mock.calls[0][0];

    expect(body.shopperContext).toEqual({});
    expect(body.cart).toEqual({ a: '1' });
  });

  it('keeps productLinkUrl and postSelectionLinkUrl independent', async () => {
    respondWith([
      {
        name: 'Shopper Context',
        labels: { value: 'title=Welcome' },
        productLink: { url: '/p' },
        postSelectionLink: { url: '/landing' },
      },
    ]);

    expect((await run()).json.mock.calls[0][0].shopperContext).toEqual({
      title: 'Welcome',
      productLinkUrl: '/p',
      postSelectionLinkUrl: '/landing',
    });
  });

  it('ignores items that are not a known group', async () => {
    respondWith([
      { name: 'Mystery', labels: null, productLink: null, postSelectionLink: { url: '/x' } },
    ]);

    expect((await run()).json.mock.calls[0][0].shopperContext).toEqual({});
  });

  it('falls back to empty groups (HTTP 200) when Sitecore fails', async () => {
    mockGraphQL.mockRejectedValue(new Error('boom'));

    const res = await run();

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json.mock.calls[0][0].shopperContext).toEqual({});
  });

  it('does nothing further when the preamble already handled the request', async () => {
    mockPreamble.mockReturnValue(true);

    await run();

    expect(mockGraphQL).not.toHaveBeenCalled();
  });
});
