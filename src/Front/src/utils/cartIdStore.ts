import { LOCALSTORAGE_KEYS } from 'constants/index';

export const PERSONAL_CONTEXT = 'personal';

export const isCartContextEnabled = () => process.env.NEXT_PUBLIC_CART_CONTEXT_ENABLED === 'true';

type CartIdMap = {
  v: number;
  entries: Record<string, string>;
};

const VERSION = 1;

const emptyMap = (): CartIdMap => ({ v: VERSION, entries: {} });

export const buildCartContextKey = (externalID?: string, businessAccountId?: string) => {
  if (!externalID) {
    return '';
  }

  const account = (businessAccountId || '').trim();

  return `${externalID}:${account || PERSONAL_CONTEXT}`;
};

export const isPersonalContextKey = (contextKey: string) =>
  contextKey.endsWith(`:${PERSONAL_CONTEXT}`);

const readMap = (): CartIdMap => {
  if (typeof window === 'undefined') {
    return emptyMap();
  }

  try {
    const raw = localStorage.getItem(LOCALSTORAGE_KEYS.ACTIVE_CART_IDS);

    if (!raw) {
      return emptyMap();
    }

    const parsed = JSON.parse(raw) as CartIdMap;

    if (!parsed || parsed.v !== VERSION || typeof parsed.entries !== 'object') {
      return emptyMap();
    }

    return { v: VERSION, entries: parsed.entries || {} };
  } catch {
    return emptyMap();
  }
};

const writeMap = (map: CartIdMap) => {
  try {
    localStorage.setItem(LOCALSTORAGE_KEYS.ACTIVE_CART_IDS, JSON.stringify(map));
  } catch {
    return;
  }
};

const readLegacyCartId = () => {
  try {
    return (localStorage.getItem(LOCALSTORAGE_KEYS.ACTIVE_CART_ID) || '').replace(/^"|"$/g, '');
  } catch {
    return '';
  }
};

export const readCartId = (contextKey: string) => {
  if (!contextKey || typeof window === 'undefined') {
    return '';
  }

  const stored = readMap().entries[contextKey];

  if (stored) {
    return stored;
  }

  return isPersonalContextKey(contextKey) ? readLegacyCartId() : '';
};

export const writeCartId = (contextKey: string, cartId: string) => {
  if (!contextKey || !cartId || typeof window === 'undefined') {
    return;
  }

  const map = readMap();

  if (map.entries[contextKey] === cartId) {
    return;
  }

  writeMap({ v: VERSION, entries: { ...map.entries, [contextKey]: cartId } });
};

export const forgetCartId = (cartId?: string) => {
  if (!cartId || typeof window === 'undefined') {
    return;
  }

  const map = readMap();
  const entries = Object.fromEntries(
    Object.entries(map.entries).filter(([, value]) => value !== cartId)
  );

  writeMap({ v: VERSION, entries });
};

export const clearCartIds = () => {
  try {
    localStorage.removeItem(LOCALSTORAGE_KEYS.ACTIVE_CART_IDS);
    localStorage.removeItem(LOCALSTORAGE_KEYS.ACTIVE_CART_ID);
  } catch {
    return;
  }
};
