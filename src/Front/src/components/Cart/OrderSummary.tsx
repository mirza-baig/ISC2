import { useRouter } from 'next/router';
import clsx from 'clsx';
import { ComponentProps, useCallback, useEffect, useState } from 'react';
import { ComponentParams, Field, ImageField, LinkField } from '@sitecore-jss/sitecore-jss-nextjs';

import { ChevronSquaredDownIcon } from 'icons/index';
import { parseFieldsFromURLString } from 'utils/index';
import { useBreakpoint } from 'hooks/index';
import { useCart, useCheckoutProcess } from 'providers/index';
import { CartSummaryPrices, LineItemPrice, LoadingIndicator } from 'ui/index';

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
  };
  params: ComponentParams;
};

const MENU_OPEN_BREAKPOINTS = ['md', 'lg', 'xl'];

const OrderSummary = ({ fields, params }: OrderSummaryProps) => {
  const router = useRouter();
  const breakpoint = useBreakpoint();
  const { setTaxErrorLabels } = useCheckoutProcess();
  const [isOpen, setIsOpen] = useState<boolean>(MENU_OPEN_BREAKPOINTS.includes(breakpoint));

  const { activeCart, isGettingCart } = useCart();

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const labels = parseFieldsFromURLString<SectionHeadingAndLabels>(fields.sectionHeadingAndLabels);

  useEffect(() => {
    setTaxErrorLabels(fields.taxCalculationErrorPopup?.fields);
  }, [fields.taxCalculationErrorPopup?.fields, setTaxErrorLabels]);

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
              <CartSummaryPrices labels={labels} showTaxes={params?.showTaxes === 'true'} />
            </div>
          </div>
        </section>
      )}

      <div className="border-t border-gray-50 px-2 py-3 !font-bold bg-black-05 flex items-center justify-between">
        <LineItemPrice
          textClassName="body-l font-bold text-gray-90"
          title={labels.totalAmountLabel}
          value={activeCart.computed.totalPrice!}
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
    </section>
  );
};

export default OrderSummary;
