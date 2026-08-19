export const DEFAULT_MAX_LINE_QUANTITY = 1;

export const clampToAtLeastOne = (quantity: number): number =>
  Number.isFinite(quantity)
    ? Math.max(DEFAULT_MAX_LINE_QUANTITY, Math.floor(quantity))
    : DEFAULT_MAX_LINE_QUANTITY;

export type ClampQuantity = typeof clampToAtLeastOne;
