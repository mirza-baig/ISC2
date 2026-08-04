import clsx from 'clsx';
import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  baseProductPrice,
  useCart,
  useCartFields,
  useStandalonePrices,
  useUserSession,
} from 'providers/index';
import { parsePrice, getProductSelectorSearchResult } from 'utils/index';
import { ProductHit, CUSTOMER_PRICING_GROUP_MAP } from 'types/index';
import { LoadingIndicator } from 'ui/index';
import { useLoggedUser, useAddToCart } from 'hooks/index';

const VARIANT_LARGE_THRESHOLD = 5;

type DonationOptionProps = {
  fields: {
    index: number;
    item: ProductHit;
    label: string;
    widthClass: string;
    price: { centAmount: number; fractionDigits: number } | undefined;
    selectedVariant: ProductHit | null;
    setSelectedVariant: (value: ProductHit) => void;
    setSelectedPrice: (value: number | undefined) => void;
  };
};

const DonationOption = ({
  fields: {
    index,
    item,
    price,
    label,
    widthClass,
    selectedVariant,
    setSelectedVariant,
    setSelectedPrice,
  },
}: DonationOptionProps) => {
  const { currencySymbol } = useUserSession();
  const [customPriceInputValue, setCustomPriceInputValue] = useState<string>('');

  const priceOutput = useMemo(() => {
    return (
      price && `${currencySymbol}${parsePrice(price?.centAmount, price?.fractionDigits, true)}`
    );
  }, [price, currencySymbol]);

  const customPrice = useMemo(() => {
    return parseFloat(customPriceInputValue || '0') * Math.pow(10, baseProductPrice.fractionDigits);
  }, [customPriceInputValue]);

  useEffect(() => {
    if (!price && selectedVariant?.sku === item?.sku) {
      setSelectedPrice(customPrice);
    }
  }, [customPrice, item?.sku, price, selectedVariant?.sku, setSelectedPrice]);

  const setPricedVariant = useCallback(() => {
    setSelectedVariant(item);
    setSelectedPrice(price?.centAmount);
  }, [item, price?.centAmount, setSelectedVariant, setSelectedPrice]);

  const setCustomVariant = useCallback(() => {
    setSelectedVariant(item);
    setSelectedPrice(customPrice);
  }, [customPrice, item, setSelectedPrice, setSelectedVariant]);

  const handleBlur = () => {
    // Convert input to a float to validate it
    const numericValue = parseFloat(customPriceInputValue.replace(',', '.'));
    if (isNaN(numericValue) || numericValue < 0) {
      setCustomPriceInputValue('');
    }
  };

  const handleChange = (value: string) => {
    // Allow empty input, or valid number
    if (value === '' || /^\d*([.,]?\d{0,2})?$/.test(value)) {
      setCustomPriceInputValue(value);
    }
  };

  return (
    <li className={widthClass} tabIndex={0}>
      {price && (
        <>
          <input
            name="donation"
            id={`donation-${index}`}
            value={item.sku}
            checked={item.sku === selectedVariant?.sku}
            type="radio"
            onChange={setPricedVariant}
            className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 cursor-pointer border checked:border-isc2-green bg-white-00 hover:text-isc2-green checked:text-isc2-green focus:ring-isc2-green focus:ring-1 rounded-full"
          />
          <label htmlFor={`donation-${index}`} className="pl-4 py-2 body-m cursor-pointer">
            {priceOutput}
          </label>
        </>
      )}
      {!price && (
        <>
          <input
            name="donation"
            id="donation-custom"
            type="radio"
            aria-labelledby="donation-label"
            checked={item.sku === selectedVariant?.sku}
            onChange={setCustomVariant}
            className="h-4 w-4 mr-2 cursor-pointer border body-m checked:border-isc2-green bg-white-00 hover:text-isc2-green checked:text-isc2-green focus:ring-isc2-green focus:ring-1 rounded-full"
          />
          <label id="donation-label" className="sr-only">
            Select custom donation amount
          </label>
          <input
            type="text"
            aria-labelledby="donation-label"
            onChange={(e) => handleChange(e.target.value)}
            onBlur={handleBlur}
            value={customPriceInputValue}
            disabled={item.sku !== selectedVariant?.sku}
            placeholder={label}
            className="h-13 px-4 max-w-36 w-full rounded-lg body-m text-black-100 border border-gray-70 hover:border-black focus:outline-none focus:ring-0 focus:border-isc2-green disabled:border-gray-300 disabled:pointer-events-none"
          />
        </>
      )}
    </li>
  );
};

const Donation = () => {
  const { activeCart } = useCart();
  const { fields, labels } = useCartFields();
  const { currencyCode } = useUserSession();
  const { isUserMember, isUserCandidate, isUserAssociate, isB2BAdminUser } = useLoggedUser();
  const { addToCart, isAddingToCart, addToCartError } = useAddToCart();
  const { productPrices, addSkuToPricingQueue, isGettingStandalonePrices } = useStandalonePrices();
  const [error, setError] = useState<string | null>(null);

  const [selectedPrice, setSelectedPrice] = useState<number | undefined>();
  const [variants, setVariants] = useState<ProductHit[] | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductHit | null>(null);
  const [donationProductKey, setDonationProductKey] = useState<string | null>(null);

  // DEBUG: Log donation component state
  console.log('[Donation] Component state:', {
    cartId: activeCart.id,
    isB2BAdminUser,
    isB2B: activeCart.computed.isB2B,
    optionalDonationProductKey: fields?.optionalDonationProductKey?.value,
    donationProductKey,
    variantsCount: variants?.length,
    isGettingStandalonePrices,
  });
  const priceRoleKey = useMemo(() => {
    return isUserMember
      ? CUSTOMER_PRICING_GROUP_MAP.MEMBERS
      : isUserCandidate
      ? CUSTOMER_PRICING_GROUP_MAP.CANDIDATES
      : isUserAssociate
      ? CUSTOMER_PRICING_GROUP_MAP.ASSOCIATES
      : CUSTOMER_PRICING_GROUP_MAP.NON_MEMBERS;
  }, [isUserMember, isUserCandidate, isUserAssociate]);

  const getDonationVariantsData = useCallback(
    async (productKeyToFetch: string) => {
      console.log('[Donation] Fetching variants for productKey:', productKeyToFetch);
      console.log(
        '[Donation] API URL:',
        `${process.env.PUBLIC_URL}/${process.env.NEXT_PUBLIC_ALGOLIA_API_PATH}/productFormSearch`
      );
      try {
        const response = await getProductSelectorSearchResult({
          facets: [],
          productKeys: [productKeyToFetch],
        });

        console.log('[Donation] Variants response:', {
          productKey: productKeyToFetch,
          response,
          hitsCount: response?.hits?.length,
          hits: response?.hits,
          facets: response?.facets,
        });

        if (!response?.hits || response?.hits?.length === 0) {
          console.log('[Donation] No hits found or empty hits array, setting error');
          console.log(
            '[Donation] This likely means the product key does not exist in Algolia index'
          );
          console.log('[Donation] Product key searched:', productKeyToFetch);
          setError(labels.donationsFetchErrorMessage);
          return;
        }

        console.log('[Donation] Setting variants:', response.hits);
        setVariants(response.hits);
      } catch (err) {
        console.error('[Donation] Error fetching variants:', err);
        setError(labels.donationsFetchErrorMessage);
      }
    },
    [labels]
  );

  useEffect(() => {
    const productKey = fields?.optionalDonationProductKey?.value;
    console.log('[Donation] useEffect triggered for fetching variants:', {
      optionalDonationProductKey: productKey,
      currentDonationProductKey: donationProductKey,
      hasVariants: Boolean(variants?.length),
    });

    if (productKey) {
      // Only fetch if we don't have variants yet OR if the product key changed
      if (!variants && donationProductKey !== productKey) {
        console.log('[Donation] Product key changed or no variants, triggering fetch');
        setDonationProductKey(productKey);
        getDonationVariantsData(productKey);
      } else if (!variants && donationProductKey === productKey) {
        // Key is same but we have no variants - retry fetch
        console.log('[Donation] No variants loaded yet, retrying fetch for:', productKey);
        getDonationVariantsData(productKey);
      } else {
        console.log('[Donation] Variants already loaded, skipping fetch');
      }
    } else {
      console.log('[Donation] No optionalDonationProductKey value in fields');
    }
  }, [fields?.optionalDonationProductKey?.value]);

  useEffect(() => {
    addSkuToPricingQueue(variants?.map((item) => item.sku) || []);
  }, [variants, addSkuToPricingQueue]);

  useEffect(() => {
    if (addToCartError) {
      setError(labels?.donationsErrorMessage);
    }
  }, [addToCartError, labels]);

  const isAlreadyAddedDonation = useMemo(
    () =>
      variants?.some((result) =>
        activeCart?.lineItems?.some(({ variant }) => variant?.sku === result.sku)
      ),
    [activeCart, variants]
  );

  const handleAddDonation = useCallback(() => {
    const isSameCurrency = activeCart.computed.currencyCode === currencyCode;

    if (
      selectedVariant &&
      selectedPrice &&
      selectedPrice > 0 &&
      (!isAlreadyAddedDonation || !isSameCurrency)
    ) {
      setError(null);
      addToCart({
        items: [selectedVariant],
        externalPrice: {
          centAmount: selectedPrice,
          currencyCode,
        },
        quantity: 1,
      });
    }
  }, [
    addToCart,
    activeCart.computed.currencyCode,
    currencyCode,
    selectedVariant,
    isAlreadyAddedDonation,
    selectedPrice,
  ]);

  const isVariantLargeAmount = useMemo(() => {
    return variants?.length && variants?.length >= VARIANT_LARGE_THRESHOLD;
  }, [variants?.length]);

  if (isB2BAdminUser || activeCart.computed.isB2B || isAlreadyAddedDonation) {
    // DEBUG: Log why donation is hidden
    console.log('[Donation] Hidden - early return:', {
      isB2BAdminUser,
      isB2B: activeCart.computed.isB2B,
      isAlreadyAddedDonation,
    });
    return null;
  }

  // DEBUG: Log render conditions
  const shouldRenderDonationBox =
    Boolean(activeCart.id) && fields?.optionalDonationProductKey?.value && donationProductKey;

  console.log('[Donation] Render conditions:', {
    hasCartId: Boolean(activeCart.id),
    hasOptionalDonationProductKey: Boolean(fields?.optionalDonationProductKey?.value),
    hasDonationProductKey: Boolean(donationProductKey),
    shouldRenderDonationBox,
  });

  // DEBUG: Log loading indicator conditions
  const showLoadingIndicator = (!error || isGettingStandalonePrices) && !variants?.length;
  console.log('[Donation] Loading indicator check:', {
    error,
    isGettingStandalonePrices,
    variantsLength: variants?.length,
    showLoadingIndicator,
  });

  return (
    <>
      {shouldRenderDonationBox && (
        <div className="bg-gray-10 border border-gray-30 px-6 py-7.5 space-y-7.5 text-black-100 body-m rounded-lg">
          {showLoadingIndicator && (
            <div className="flex items-center justify-center">
              <LoadingIndicator />
            </div>
          )}
          {!variants?.length && error && !isGettingStandalonePrices && (
            <p className="text-red-error body-s">{error}</p>
          )}
          {Boolean(variants?.length) && !isGettingStandalonePrices && (
            <>
              <div>
                {labels?.donationsCheckboxLabel && (
                  <label htmlFor="apply-donation" className="cursor-pointer">
                    {labels?.donationsCheckboxLabel}
                  </label>
                )}
              </div>
              <div>
                {labels?.donationsOptionsListLabel && (
                  <p className="mb-5 font-bold">{labels?.donationsOptionsListLabel}</p>
                )}
                <ul
                  className={clsx(
                    'flex flex-wrap w-full',
                    isVariantLargeAmount && 'lg:justify-between'
                  )}
                >
                  {variants
                    ?.sort((a: ProductHit, b: ProductHit) => {
                      const priceA = productPrices?.[a.sku]?.[priceRoleKey]?.value?.centAmount;
                      const priceB = productPrices?.[b.sku]?.[priceRoleKey]?.value?.centAmount;
                      return priceA - priceB;
                    })
                    .map((item, index) => (
                      <DonationOption
                        key={index}
                        fields={{
                          index,
                          item,
                          label: labels.donationsCustomAmountLabel,
                          selectedVariant,
                          setSelectedVariant,
                          setSelectedPrice,
                          price: productPrices?.[item.sku]?.[priceRoleKey]?.value,
                          widthClass: clsx(
                            'flex relative space-x-2 items-center',
                            'w-full sm:w-1/2 md:w-1/3 lg:w-auto',
                            isVariantLargeAmount ? 'pr-4' : 'pr-6'
                          ),
                        }}
                      />
                    ))}
                </ul>
              </div>
              {error && <p className="text-red-error body-s">{error}</p>}
              <div>
                <button
                  className="primary-cta min-w-40 p-4 page-link bold-link text-center"
                  onClick={handleAddDonation}
                  disabled={isAddingToCart}
                  aria-label={labels.donationsSubmitButtonLabel}
                >
                  {labels.donationsSubmitButtonLabel}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default Donation;
