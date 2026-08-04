type PaymentIdentifier = {
  type: 'card' | 'google_wallet' | 'apple_pay';
  identifier: string;
};

export const maskPaymentIdentifier = (
  payment: PaymentIdentifier,
  maskChar = '*',
  digitsToKeep = 4
): string => {
  const identifier = payment.identifier.toString();

  const digitsToMask = identifier.length - digitsToKeep;

  const maskedSection = identifier.slice(0, digitsToMask).replace(/\d/g, maskChar);
  const visibleSection = identifier.slice(digitsToMask);

  return maskedSection + visibleSection;
};
