import { Cart, CartWithComputedData } from 'types/index';

/**
 * Reader for the B2B step-1 Purchase Information custom fields written to the cart
 * via `useSetCartCustomFields` (setCustomType against `ISCCartOrderModelCustomization`).
 *
 * commercetools returns each custom field's value as a JSON-scalar string, so
 * a stored string `"111--33"` comes back as the literal `"\"111--33\""` and
 * needs a JSON.parse to unwrap. This helper hides that detail and returns
 * plain strings (or undefined if the field was never written).
 *
 * Intended for step-2 / order review / confirmation-email surfaces. The values
 * are guaranteed present only for B2B carts that completed step 1.
 */
export type B2BCartCustomFields = {
  poNumber?: string;
  customerOrderReference?: string;
  organization?: string;
  buyer?: string;
};

const CUSTOM_FIELD_NAMES = [
  'poNumber',
  'customerOrderReference',
  'organization',
  'buyer',
] as const;

type KnownFieldName = (typeof CUSTOM_FIELD_NAMES)[number];

const safeParse = (raw: string): string | undefined => {
  try {
    const parsed = JSON.parse(raw);
    // Only strings are valid for these fields. Anything else (number, object,
    // null from a legacy write) is treated as absent rather than surfacing a
    // bad type downstream.
    return typeof parsed === 'string' ? parsed : undefined;
  } catch {
    // A non-JSON value in the store (should not happen if writes go through
    // useSetCartCustomFields) — fall back to the raw string so we don't lose
    // the value entirely.
    return raw || undefined;
  }
};

export const readCartCustomFields = (
  cart?: Cart | CartWithComputedData | null
): B2BCartCustomFields => {
  const raw = cart?.custom?.customFieldsRaw ?? [];

  const get = (name: KnownFieldName): string | undefined => {
    const field = raw.find((f) => f.name === name);
    if (!field || field.value === undefined || field.value === null) {
      return undefined;
    }
    return safeParse(String(field.value));
  };

  return {
    poNumber: get('poNumber'),
    customerOrderReference: get('customerOrderReference'),
    organization: get('organization'),
    buyer: get('buyer'),
  };
};
