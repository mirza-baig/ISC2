import {
  AddToCartHit,
  BundleLineItem,
  Cart,
  CartLineItem,
  CartWithComputedData,
  LineItem,
  LineItemVariantAttribute,
  LocalizedAttributeValue,
} from 'types/index';
import {
  BUNDLES_DISCOUNTS_NAME,
  CART_TYPE_ATTR,
  CART_TYPE_CPQ,
  DONATION_NAME,
  LINE_ITEMS_ATTRIBUTES,
  SUBSCRIPTION_PRODUCT_TYPES,
  CART_ATTRIBUTES,
  FREE_PRICE,
} from 'constants/cart';
import { POSTAL_CODES_PATTERNS } from 'constants/postalCodesPatterns';
import { useCart } from 'providers/cart';

import { calculateDiscount, parsePrice, parsePriceFromMoney } from './price';
import { getCurrencySymbol } from './currencies';
import { DEFAULT_BRAND } from 'constants/index';

const DEFAULT_SUMMARY = {
  subtotal: 0,
  itemsQuantity: 0,
  notAvailableItemsQuantity: 0,
  hasNotAvailableProducts: false,
};

// Which OCCURRENCE of a bundle a raw cart line belongs to — the key `cart.bundles` is grouped by.
//
// Falls back to the bundle SKU whenever no instance was written, which is every line added before
// multi-occurrence support and every line added by a caller that did not opt in (the PDP). That
// fallback is the compatibility contract, and it mirrors `getBundleInstanceKey` in the cart
// service — the two must agree or a row will not find its lines.
const getBundleInstanceKey = (lineItem: LineItem): string | undefined => {
  const field = (name: string) =>
    lineItem.custom?.customFieldsRaw?.find((attr) => attr.name === name)?.value;

  return (field('bundle-instance') ?? field('bundle-sku')) as string | undefined;
};

export const addComputedFieldsToLineItems = (cart: Cart): Cart => {
  const processedBundleProductId: string[] = [];

  const bundlesLineItems: BundleLineItem[] = Object.keys(cart.bundles || {}).reduce(
    (accum, bundleName) => {
      const bundle = cart.bundles[bundleName];

      if (!bundle.skus.length) {
        return accum;
      }

      const bundleLineItems = (cart.lineItems as LineItem[]).filter((item) => {
        // Matched on the occurrence, not the bundle SKU: a cart holding the same class for two
        // dates has two entries here, and comparing on the SKU would hand BOTH sets of component
        // lines to each of them — one row priced double, the other's lines consumed twice.
        const isMatchingBundle = getBundleInstanceKey(item) === bundleName;
        return isMatchingBundle && bundle.skus.includes(item.variant.sku);
      });

      const availableQuantities = bundleLineItems.map((product) => product.availableQuantity);

      bundleLineItems.forEach(({ id }) => processedBundleProductId.push(id));

      return [
        ...accum,
        {
          id: bundleName,
          // The bundle SKU is no longer recoverable from `id` once that id is an occurrence key,
          // so the summary carries it. Older cart payloads have no `bundleSku`, and there the id
          // IS the bundle SKU — which is why the fallback is exactly right rather than a guess.
          bundleSku: bundle.bundleSku ?? bundleName,
          // Seats. `1` for everything the PDP adds (commercetools defaults a bundle add to one),
          // and the real count for a B2B listing add that asked for several.
          quantity: bundle.quantity ?? 1,
          productType: {
            id: 'bundle',
            name: 'bundle',
          },
          name: bundle.name,
          productKey: bundle.productKey,
          totalPrice: bundle.totalPrice,
          nonMemberPrice: bundle.totalPrice,
          variant: { sku: bundle.productKey },
          availableQuantity: Math.min(...availableQuantities),
          products: bundleLineItems,
          price: {
            value: bundle.totalPrice,
            discounted: null,
          },
        },
      ];
    },
    []
  );

  const regularLineItems = (cart.lineItems as LineItem[]).filter(
    (item) => !processedBundleProductId.includes(item.id)
  );

  const parsedRegularLineItems = regularLineItems.map((lineItem) => {
    const { availableQuantity = 0 } = (cart.inventories || {})[lineItem.variant.sku] || {};
    const nonMemberPrice = cart.nonMemberPrice[lineItem.variant.sku]?.value;
    const isDonation = isDonationItem(lineItem?.name);

    return {
      ...lineItem,
      availableQuantity: isDonation ? Number.MAX_SAFE_INTEGER : availableQuantity,
      nonMemberPrice: isDonation ? lineItem.totalPrice : nonMemberPrice,
    };
  });

  return {
    ...cart,
    lineItems: [...bundlesLineItems, ...parsedRegularLineItems],
  };
};

export const getLineItemsSummary = (lineItems?: CartLineItem[]) => {
  return (lineItems || []).reduce((accum, lineItem) => {
    const finalPrice = parsePriceFromMoney(lineItem.totalPrice, 1) as number;
    const isOutOfStock = lineItem.availableQuantity === 0;

    return {
      hasNotAvailableProducts: accum.hasNotAvailableProducts || isOutOfStock,
      subtotal: accum.subtotal + finalPrice,
      itemsQuantity: accum.itemsQuantity + lineItem.quantity,
      notAvailableItemsQuantity: isOutOfStock
        ? accum.notAvailableItemsQuantity + lineItem.quantity
        : accum.notAvailableItemsQuantity,
    };
  }, DEFAULT_SUMMARY);
};

type AttrValue = LineItemVariantAttribute['value'];

const isLocalizedValue = (attributeValue: AttrValue): attributeValue is LocalizedAttributeValue => {
  return typeof attributeValue === 'object' && 'key' in attributeValue && 'label' in attributeValue;
};

const parseAttributes = (customAttributes: LineItemVariantAttribute[], attributes: string[]) => {
  return customAttributes.reduce((accum, attribute) => {
    if (attributes.includes(attribute.name)) {
      if (isLocalizedValue(attribute.value)) {
        if (attribute.name === 'time_zone_iana') {
          return {
            ...accum,
            [attribute.name]: attribute.value.key.replace(/_/g, '/'),
          };
        }
        return {
          ...accum,
          [attribute.name]: attribute.value.label.toString(),
        };
      }

      return {
        ...accum,
        [attribute.name]: attribute.value.toString(),
      };
    }

    return accum;
  }, {} as Record<string, string>);
};

export const getCartAttributes = (
  cart: CartWithComputedData | Cart,
  attributes = CART_ATTRIBUTES
) => {
  if (!cart.custom?.customFieldsRaw) {
    return {};
  }

  return parseAttributes(cart.custom.customFieldsRaw, attributes);
};

export const getVariantAttributes = (
  variant: CartLineItem['variant'],
  attributes = LINE_ITEMS_ATTRIBUTES
) => {
  if (!variant?.attributesRaw) {
    return {};
  }

  return parseAttributes(variant.attributesRaw, attributes);
};

export const isDonationItem = (str = '') => str.toLowerCase().includes(DONATION_NAME);

// Mirrors the totalPrice computed field below, for carts returned by a mutation
// (recalculate/tax) that have not been through getComputedFieldsFromCart yet.
export const isCartTotalFree = (cart?: Partial<Cart> | null) => {
  const totalPriceToUse = cart?.taxedPrice?.totalGross || cart?.totalPrice;

  return (
    Boolean(totalPriceToUse) &&
    parsePrice(totalPriceToUse?.centAmount, totalPriceToUse?.fractionDigits) === FREE_PRICE
  );
};

export const getComputedFieldsFromCart = (cart: Cart | null, isSuccess: boolean) => {
  const lineItemsSummary = getLineItemsSummary(cart?.lineItems);
  const isEmpty = !cart?.totalLineItemQuantity;
  const isFetchedAndEmpty = isSuccess && isEmpty;
  const cartType = (cart?.custom?.customFieldsRaw || []).find(
    ({ name }) => name === CART_TYPE_ATTR
  );

  const includesSubscription = (cart?.lineItems || []).some((item) =>
    SUBSCRIPTION_PRODUCT_TYPES.includes((item.productType?.name || '').toLowerCase())
  );

  // DEBUG: Log subscription detection
  if (cart?.lineItems?.length) {
    console.log('[getComputedFieldsFromCart] Subscription check:', {
      SUBSCRIPTION_PRODUCT_TYPES,
      includesSubscription,
      lineItemsProductTypes: cart?.lineItems?.map((item) => ({
        name: item.name,
        productTypeName: item.productType?.name,
        productTypeNameLower: (item.productType?.name || '').toLowerCase(),
        isSubscription: SUBSCRIPTION_PRODUCT_TYPES.includes(
          (item.productType?.name || '').toLowerCase()
        ),
      })),
    });
  }

  const { totalTax, totalGross } = cart?.taxedPrice || {};
  const totalPriceToUse = totalGross || cart?.totalPrice;

  return {
    isEmpty,
    isFetchedAndEmpty,
    currencyCode: cart?.totalPrice?.currencyCode,
    isCheckoutDisabled:
      isSuccess &&
      (isEmpty || lineItemsSummary.notAvailableItemsQuantity === lineItemsSummary.itemsQuantity),
    currencySymbol: getCurrencySymbol(cart?.totalPrice?.currencyCode || 'USD'),
    totalPrice: parsePrice(totalPriceToUse?.centAmount, totalPriceToUse?.fractionDigits),
    taxValue: parsePrice(totalTax?.centAmount, totalTax?.fractionDigits),
    isB2B: cartType?.value === CART_TYPE_CPQ,
    includesSubscription,
    ...lineItemsSummary,
  };
};

export const useAnalyticsItems = () => {
  const { activeCart } = useCart();

  return activeCart.lineItems?.map((item) => {
    const attributes = getVariantAttributes(item.variant);
    const discount = calculateDiscount(
      item.price.value,
      item.price.discounted?.value,
      item.nonMemberPrice
    );

    return {
      item_id: item.productKey,
      item_name: item.name,
      item_variant: item.variant.sku,
      item_category: item.productType?.name,
      ...(attributes['division'] !== undefined && { item_category2: attributes['division'] }),
      ...(attributes['modality'] !== undefined && { item_category3: attributes['modality'] }),
      item_brand: attributes['training_provider_'] || DEFAULT_BRAND,
      price: parsePriceFromMoney(item.price.discounted?.value || item.price.value, 1),
      ...(discount !== undefined && { discount }),
      quantity: item.quantity,
    };
  });
};

export const getSelectDateBundlePayload = ({
  sku,
  selectedDateSkuWithBundleOption,
  productKey,
}: {
  sku: string;
  selectedDateSkuWithBundleOption?: string | boolean;
  productKey?: string;
}): AddToCartHit => {
  if (productKey && typeof selectedDateSkuWithBundleOption === 'string') {
    return {
      sku,
      pickedProducts: [{ sku: selectedDateSkuWithBundleOption, productKey }],
    };
  }

  return { sku };
};

export const isBundleLineItem = (lineItem: CartLineItem): lineItem is BundleLineItem =>
  'products' in lineItem;

export const getPriceQuantityFor = (lineItem: CartLineItem): number =>
  isBundleLineItem(lineItem) ? 1 : lineItem.quantity;

/**
 * Which class session a bundle line in the cart was added for.
 *
 * commercetools explodes a bundle into one line item per component and keeps no record of which
 * component the shopper picked, so this reads it back off the components: for a class bundle the
 * picked product is by definition the DATED session — every fixed component (the exam) is dateless.
 * Needed wherever a bundle has to be RE-sent (a currency rebuild, a quantity change), since an add
 * without its picked session is rejected outright.
 */
export const getPickedProductFromBundleLine = (bundleLine: BundleLineItem): LineItem | undefined =>
  bundleLine.products?.find((product) => getVariantAttributes(product.variant).start_date);

export const removeBundleDiscountCodes = (cart: Cart): Cart => {
  const filteredDiscountCodes = (cart.discountCodes || []).filter(
    ({ discountCode }) => !discountCode?.code?.startsWith(BUNDLES_DISCOUNTS_NAME)
  );

  return {
    ...cart,
    discountCodes: filteredDiscountCodes,
  };
};

export type TaxAddressInput = {
  city?: string;
  country?: string;
  countryCode?: string;
  postalCode?: string;
  state?: string;
  stateCode?: string;
  street?: string;
  streetName?: string;
};

const hasAddressValue = (value?: string) => Boolean(value?.trim());

/** Matches checkout/profile UI: postal is required only when a country has a pattern. */
export const isPostalCodeRequiredForCountry = (countryCode?: string) => {
  if (!countryCode?.trim()) {
    return false;
  }

  return Boolean(
    POSTAL_CODES_PATTERNS[countryCode.trim().toUpperCase() as keyof typeof POSTAL_CODES_PATTERNS]
  );
};

/** Cart/shipping address has the fields tax calculation requires. */
export const isTaxAddressDefined = (address?: TaxAddressInput) => {
  const country = address?.country || address?.countryCode;
  const street = address?.street || address?.streetName;
  const postalCodeRequired = isPostalCodeRequiredForCountry(country);

  return Boolean(
    hasAddressValue(country) &&
      hasAddressValue(street) &&
      hasAddressValue(address?.city) &&
      (!postalCodeRequired || hasAddressValue(address?.postalCode))
  );
};

export const getAddressDiagnostics = (address?: TaxAddressInput) => {
  const postalCode = address?.postalCode;

  return {
    hasAddress: Boolean(address),
    country: address?.country || address?.countryCode,
    state: address?.state || address?.stateCode,
    cityPresent: Boolean(address?.city?.trim()),
    postalCodePresent: Boolean(address?.postalCode?.trim()),
    postalCodePrefix: postalCode
      ? postalCode.replace(/\s/g, '').slice(0, 3).toUpperCase()
      : undefined,
    streetPresent: Boolean((address?.street || address?.streetName)?.trim()),
  };
};
