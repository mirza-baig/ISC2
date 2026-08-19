export const STRIPE_RETURN_QUERY_KEYS = [
  'redirect_status',
  'payment_intent',
  'payment_intent_client_secret',
] as const;

export const getQueryParam = (value: string | string[] | undefined): string | undefined =>
  Array.isArray(value) ? value[0] : value;

export type StripeCheckoutReturnParams = {
  redirectStatus: string;
  paymentIntentId: string;
};

export function getStripeCheckoutReturnParams(
  query: Record<string, string | string[] | undefined>
): StripeCheckoutReturnParams | null {
  const redirectStatus = getQueryParam(query.redirect_status);
  const paymentIntentId = getQueryParam(query.payment_intent);

  if (!redirectStatus || !paymentIntentId) {
    return null;
  }

  return { redirectStatus, paymentIntentId };
}

function getOrigin(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin.replace(/\/$/, '');
  }

  return (process.env.PUBLIC_URL ?? '').replace(/\/$/, '');
}

export function buildConfirmationRedirectUrl(href: string | null | undefined): string {
  const path = (href ?? '').replace(/^\//, '');
  return `${getOrigin()}/${path}`;
}

export function withRedirectStatus(base: string, status: string): string {
  const separator = base.includes('?') ? '&' : '?';
  return `${base}${separator}redirect_status=${status}`;
}

export function buildCheckoutReturnUrl(asPath: string): string {
  const origin = getOrigin();
  const normalizedPath = asPath.startsWith('/') ? asPath : `/${asPath}`;
  const [pathname, query = ''] = normalizedPath.split('?');

  const filteredQuery = query
    .split('&')
    .filter((pair) => {
      const key = pair.split('=')[0];
      return (
        key && !(STRIPE_RETURN_QUERY_KEYS as readonly string[]).includes(decodeURIComponent(key))
      );
    })
    .join('&');

  return filteredQuery ? `${origin}${pathname}?${filteredQuery}` : `${origin}${pathname}`;
}
