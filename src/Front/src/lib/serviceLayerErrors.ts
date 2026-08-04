export const SERVICE_LAYER_ERROR_CODES = {
  INVALID_TOKEN: 'INVALID_TOKEN',
  PRICE_NOT_FOUND: 'PRICE_NOT_FOUND',
  CART_NOT_FOUND: 'CART_NOT_FOUND',
  TAX_CATEGORY_MISSING: 'TAX_CATEGORY_MISSING',
  TAX_RATE_MISSING: 'TAX_RATE_MISSING',
  GENERAL_ERROR: 'GENERAL_ERROR',
} as const;

export type ServiceLayerErrorCode =
  (typeof SERVICE_LAYER_ERROR_CODES)[keyof typeof SERVICE_LAYER_ERROR_CODES];

export const classifyServiceLayerError = (message?: string): ServiceLayerErrorCode => {
  if (!message) return SERVICE_LAYER_ERROR_CODES.GENERAL_ERROR;

  const m = message.toLowerCase();

  if (m.includes('invalid_token')) {
    return SERVICE_LAYER_ERROR_CODES.INVALID_TOKEN;
  }

  if (m.includes('does not contain a price')) {
    return SERVICE_LAYER_ERROR_CODES.PRICE_NOT_FOUND;
  }

  if (
    m.includes('uri not found') ||
    m.includes('/carts/') ||
    m.includes('was not found') ||
    m.includes('does not exist')
  ) {
    return SERVICE_LAYER_ERROR_CODES.CART_NOT_FOUND;
  }

  if (m.includes('missing a tax category')) {
    return SERVICE_LAYER_ERROR_CODES.TAX_CATEGORY_MISSING;
  }

  if (m.includes('missing a tax rate')) {
    return SERVICE_LAYER_ERROR_CODES.TAX_RATE_MISSING;
  }

  return SERVICE_LAYER_ERROR_CODES.GENERAL_ERROR;
};

export const userFacingErrorCode = (code: ServiceLayerErrorCode): 'CT_001' | 'CT_002' =>
  code === SERVICE_LAYER_ERROR_CODES.PRICE_NOT_FOUND ? 'CT_002' : 'CT_001';
