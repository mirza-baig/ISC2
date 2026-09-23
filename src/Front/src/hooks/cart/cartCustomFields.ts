import { Cart, CartWithComputedData } from 'types/index';
export type B2BCartCustomFields = {
  poNumber?: string;
  customerOrderReference?: string;
  organization?: string;
  buyer?: string;
};

const CUSTOM_FIELD_NAMES = ['poNumber', 'customerOrderReference', 'organization', 'buyer'] as const;

type KnownFieldName = (typeof CUSTOM_FIELD_NAMES)[number];

export const parseCustomFieldValue = (raw: string): string | undefined => {
  if (raw.length > 1 && raw.startsWith('"') && raw.endsWith('"')) {
    try {
      const parsed = JSON.parse(raw);

      return typeof parsed === 'string' ? parsed || undefined : raw;
    } catch {
      return raw;
    }
  }

  return raw || undefined;
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
    return parseCustomFieldValue(String(field.value));
  };

  return {
    poNumber: get('poNumber'),
    customerOrderReference: get('customerOrderReference'),
    organization: get('organization'),
    buyer: get('buyer'),
  };
};
