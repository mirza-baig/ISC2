import { useRouter } from 'next/router';
import clsx from 'clsx';
import { ComponentProps, useCallback, useEffect, useMemo, useState } from 'react';
import { ComponentParams, Field, ImageField, LinkField } from '@sitecore-jss/sitecore-jss-nextjs';

import { ChevronSquaredDownIcon } from 'icons/index';
import { mapQuoteLabelsFromSitecoreFields, parseFieldsFromURLString } from 'utils/index';
import { useBreakpoint, usePrepaidCheckoutSummary } from 'hooks/index';
import { useCart, useCheckoutProcess } from 'providers/index';
import { CartSummaryPrices, LineItemPrice, LoadingIndicator } from 'ui/index';
import { CHECKOUT_STEP_TWO_ACTIONS_ANCHOR_ID, CHECKOUT_STEPS } from 'constants/index';
import { QuoteSitecoreFields } from 'types/index';

import CartCoupon from './CartCoupon';
import { OrderSummaryItems } from './OrderSummary/OrderSummaryItems';
import { CartButtons } from './OrderSummary/CartButtons';
import { TaxErrorPopupLabels } from 'types/checkout';

export type SectionHeadingAndLabels = {
  heading: string;
  subtotalLabel: string;
  taxLabel: string;
  totalAmountLabel: string;
  secondaryCtaLabel: string;
  viewDetailsLabel: string;
  hideDetailsLabel: string;
  productNotAvailableLabel: string;
  taxCalculationErrorMessage: string;
  taxTbd: string;
  yourPriceLabel: string;
};

type OrderSummaryProps = {
  fields: ComponentProps<typeof CartCoupon> & {
    primaryCta: LinkField;
    sectionHeadingAndLabels: Field<string>;
    taxCalculationErrorPopup: {
      fields: TaxErrorPopupLabels;
    };
    enableCartOnlyFeatures: Field<boolean>;
    icon: ImageField;
    quoteTermsAndConditionsLink: LinkField;
  };
  params: ComponentParams;
};

const MENU_OPEN_BREAKPOINTS = ['md', 'lg', 'xl'];

const OrderSummary = ({ fields, params }: OrderSummaryProps) => {
  const router = useRouter();
  const breakpoint = useBreakpoint();
  const { activeStep, setTaxErrorLabels, setQuoteLabels } = useCheckoutProcess();
  const prepaidSummary = usePrepaidCheckoutSummary();
  const [isOpen, setIsOpen] = useState<boolean>(MENU_OPEN_BREAKPOINTS.includes(breakpoint));

  const { activeCart, isGettingCart } = useCart();

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Memoized so this only changes reference when the underlying field does — it feeds
  // the quote-labels effect below, and a fresh object every render would re-fire that
  // effect (and its setQuoteLabels call) on every render instead of only on real change.
  const labels = useMemo(
    () =>
      parseFieldsFromURLString<SectionHeadingAndLabels & QuoteSitecoreFields>(
        fields.sectionHeadingAndLabels
      ),
    [fields.sectionHeadingAndLabels]
  );

  useEffect(() => {
    setTaxErrorLabels(fields.taxCalculationErrorPopup?.fields);
  }, [fields.taxCalculationErrorPopup?.fields, setTaxErrorLabels]);

  const termsAndConditionsText = fields.quoteTermsAndConditionsLink?.value?.text;
  const termsAndConditionsUrl = fields.quoteTermsAndConditionsLink?.value?.href;

  // Quote PDF labels are authored onto this same field (as `Quote`-prefixed keys)
  // rather than a dedicated field on the Checkout component, since that's where content
  // authors already had a URL-encoded labels blob to add to. Pushed into checkout
  // context so PaymentInformationForm — a separately-placed sibling component with no
  // access to this component's `fields` — can read them.
  useEffect(() => {
    setQuoteLabels({
      ...mapQuoteLabelsFromSitecoreFields(labels),
      disclaimerText: termsAndConditionsText,
      disclaimerLinkUrl: termsAndConditionsUrl,
    });
  }, [labels, termsAndConditionsText, termsAndConditionsUrl, setQuoteLabels]);

  useEffect(() => {
    const shouldBeMenuOpen = MENU_OPEN_BREAKPOINTS.includes(breakpoint);

    setIsOpen(shouldBeMenuOpen);
  }, [breakpoint]);

  const onBackClick = (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    router.back();
  };

  const onToggleMenu = useCallback(() => setIsOpen((prevIsOpen) => !prevIsOpen), []);

  if (isMounted && isGettingCart) {
    return (
      <section className="border border-gray-70 rounded-lg px-6 py-8 md:p-10 bg-white flex flex-col">
        <h3 className="text-2xl font-light md:headline-m mb-3 md:mb-8">{labels.heading}</h3>
        <LoadingIndicator className="self-center" />
      </section>
    );
  }

  return (
    <section className="border border-gray-70 rounded-lg px-6 py-8 md:p-10 bg-white flex flex-col">
      <h3 className="text-2xl font-light md:headline-m mb-3 md:mb-8">{labels.heading}</h3>

      <button
        type="button"
        onClick={onToggleMenu}
        className="text-xsm flex items-center md:hidden mb-2"
        aria-label={isOpen ? labels.hideDetailsLabel : labels.viewDetailsLabel}
      >
        {isOpen ? labels.hideDetailsLabel : labels.viewDetailsLabel}
        <ChevronSquaredDownIcon
          size={24}
          className={clsx('transition-all duration-150', isOpen && 'rotate-180')}
        />
      </button>

      {activeCart.computed.itemsQuantity > 0 && (
        <section className={clsx('transition-height', isOpen && 'open')}>
          <div
            className={clsx(
              'overflow-hidden',
              fields?.enableCartOnlyFeatures?.value ? 'space-y-5 md:space-y-8' : 'space-y-4'
            )}
          >
            {fields?.enableCartOnlyFeatures?.value && !activeCart.computed.isB2B && (
              <CartCoupon couponTitleAndLabels={fields.couponTitleAndLabels} />
            )}

            {!fields?.enableCartOnlyFeatures.value && (
              <OrderSummaryItems
                productNotAvailableLabel={labels.productNotAvailableLabel}
                userPriceLabel={params?.showUserPriceLabel === 'true' ? labels.yourPriceLabel : ''}
                orderDetailsMode={params?.orderDetailsMode === 'true'}
              />
            )}

            <div className="flex flex-col gap-3 md:gap-2 !mb-4">
              <CartSummaryPrices
                labels={labels}
                showTaxes={params?.showTaxes === 'true'}
                prepaidDiscount={
                  prepaidSummary
                    ? { title: prepaidSummary.title, amount: prepaidSummary.discountAmount }
                    : undefined
                }
                totalOverride={prepaidSummary?.total}
              />
            </div>
          </div>
        </section>
      )}

      <div className="border-t border-gray-50 px-2 py-3 !font-bold bg-black-05 flex items-center justify-between">
        <LineItemPrice
          textClassName="body-l font-bold text-gray-90"
          title={labels.totalAmountLabel}
          value={prepaidSummary?.total ?? activeCart.computed.totalPrice!}
          currency={activeCart.computed.currencySymbol}
        />
      </div>

      {fields?.enableCartOnlyFeatures?.value && (
        <CartButtons
          primaryCta={fields?.primaryCta}
          secondaryCta={{
            text: labels.secondaryCtaLabel,
            onClick: onBackClick,
          }}
        />
      )}

      {/*
        PaymentInformationForm portals its Download Quote / Confirm Purchase buttons
        here, so they render under this order summary box like the prototype instead of
        in the left-column form footer. Only present on the Payment Information step —
        this component's other consumer (the Cart page, enableCartOnlyFeatures) never
        reaches that step, so the two never collide.
      */}
      {activeStep === CHECKOUT_STEPS.PAYMENT_INFORMATION && (
        <div
          id={CHECKOUT_STEP_TWO_ACTIONS_ANCHOR_ID}
          className="flex flex-col items-center gap-4 md:gap-2 mt-4 md:mt-8"
        />
      )}
      {activeStep === CHECKOUT_STEPS.PERSONAL_INFORMATION && (
        <div
          id="checkout-step-two-actions"
          className="flex flex-col items-center gap-4 md:gap-2 mt-4 md:mt-8"
        >
          <button
            type="button"
            className="border border-gray-50 bg-gray-100 px-4 py-2 text-gray-400 opacity-60 cta relative flex space-x-2 self-end !text-xs w-full justify-center cursor-default"
            aria-label="Download Quote"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M8 0.888916V10.2222M8 10.2222L11.5556 6.66669M8 10.2222L4.44444 6.66669M1.33333 12.4445V13.7778C1.33333 14.5142 1.93028 15.1112 2.66667 15.1112H13.3333C14.0697 15.1112 14.6667 14.5142 14.6667 13.7778V12.4445"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>Download Quote</span>
          </button>
        </div>
      )}
    </section>
  );
};

export default OrderSummary;
