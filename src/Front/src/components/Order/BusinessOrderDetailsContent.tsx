import { useMemo } from 'react';
import { useRouter } from 'next/router';

import { useCart, useShopperContext } from 'providers/index';
import {
  useDownloadBusinessReceipt,
  useHasAllocatorRelationship,
  useLoggedUser,
} from 'hooks/index';
import {
  buildBusinessReceiptData,
  formatDate,
  parseFieldsFromURLString,
  parsePrice,
  resolveBusinessPaymentMethod,
} from 'utils/index';
import {
  BUSINESS_ORDER_CONFIRMATION_DEFAULT_LABELS,
  BUSINESS_PAYMENT_METHOD_DEFAULT_STEPS,
  BUSINESS_PAYMENT_METHODS,
} from 'constants/index';
import {
  BusinessOrderConfirmationLabels,
  CartLineItem,
  OrderWithComputedData,
  TypedMoney,
} from 'types/index';
import { TickIcon } from 'icons/index';
import { Button } from 'ui/index';

import { OrderDetailsFields } from './OrderDetails';

interface BusinessOrderDetailsContentProps {
  fields: OrderDetailsFields;
  order: OrderWithComputedData;
}

type WhatHappensNextStep = {
  key: string;
  title: string;
  copy: string;
};

/**
 * Business order confirmation.
 *
 * Differs from the individual confirmation in `OrderDetailsContent` by showing the
 * selected payment method, a quantity and unit price per product, a "What Happens Next?"
 * box whose steps depend on how the cart was paid for, and a downloadable Transaction
 * Receipt PDF in place of the browser print dialog.
 */
const BusinessOrderDetailsContent = ({ fields, order }: BusinessOrderDetailsContentProps) => {
  const router = useRouter();
  const { activeCart } = useCart();
  const { hasAllocatorRelationship } = useHasAllocatorRelationship();
  const { shopperContext } = useShopperContext();
  const { downloadReceipt, isGeneratingReceipt } = useDownloadBusinessReceipt();
  const { user } = useLoggedUser();

  const labels = parseFieldsFromURLString<BusinessOrderConfirmationLabels>(
    fields.labelsTooltipsAndMore
  );

  const label = <TKey extends keyof typeof BUSINESS_ORDER_CONFIRMATION_DEFAULT_LABELS>(
    key: TKey & keyof BusinessOrderConfirmationLabels
  ): string => labels?.[key] || BUSINESS_ORDER_CONFIRMATION_DEFAULT_LABELS[key];

  const currencySymbol = order.computed.currencySymbol;
  const formatMoney = (money?: TypedMoney) =>
    `${currencySymbol}${parsePrice(money?.centAmount, money?.fractionDigits)}`;

  const businessPaymentMethod = useMemo(() => resolveBusinessPaymentMethod(order), [order]);

  /**
   * The localised `name` is null on real orders more often than not, so fall back to the
   * raw `method`. The payment method is a required detail on this screen — dropping the
   * row when only `name` is missing would silently fail the requirement.
   */
  const paymentMethodName = useMemo(() => {
    const paymentMethodInfo = order.paymentInfo?.payments?.[0]?.paymentMethodInfo;

    return paymentMethodInfo?.name || paymentMethodInfo?.method;
  }, [order.paymentInfo?.payments]);

  const lineItems = useMemo(
    () => (activeCart.lineItems ?? []) as CartLineItem[],
    [activeCart.lineItems]
  );

  /**
   * Step 2 is the conditional one: the payment step renders only for the business
   * payment methods.
   */
  const whatHappensNextSteps = useMemo<WhatHappensNextStep[]>(() => {
    const steps: WhatHappensNextStep[] = [
      {
        key: 'email-confirmation',
        title: label('emailConfirmationStepTitle'),
        copy: label('emailConfirmationStepCopy').replace('{userEmail}', order.customerEmail ?? ''),
      },
    ];

    if (businessPaymentMethod) {
      const defaults = BUSINESS_PAYMENT_METHOD_DEFAULT_STEPS[businessPaymentMethod];
      const isPreapprovedCredit =
        businessPaymentMethod === BUSINESS_PAYMENT_METHODS.PREAPPROVED_CREDIT;

      steps.push({
        key: businessPaymentMethod,
        title:
          (isPreapprovedCredit
            ? labels?.preapprovedCreditStepTitle
            : labels?.prepaidAccountStepTitle) || defaults.title,
        copy:
          (isPreapprovedCredit
            ? labels?.preapprovedCreditStepCopy
            : labels?.prepaidAccountStepCopy) || defaults.copy,
      });
    }

    steps.push({
      key: 'order-allocation',
      title: label('orderAllocationStepTitle'),
      copy: label('orderAllocationStepCopy'),
    });

    return steps;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessPaymentMethod, labels, order.customerEmail]);

  /**
   * Destinations are General Link fields on this component's own datasource, so a moved
   * target page keeps resolving. The CTA is hidden rather than pushed to a dead path when
   * the relevant link is not authored.
   */
  const dashboardLink = hasAllocatorRelationship
    ? fields.orderAllocationUrl?.value
    : fields.orderHistoryUrl?.value;

  const dashboardDestination = dashboardLink?.href;

  /**
   * Business buyers get a generated Transaction Receipt PDF rather than the browser
   * print dialog the individual confirmation uses.
   */
  const onPrintReceipt = () => {
    const receiptData = buildBusinessReceiptData({
      order,
      cart: activeCart,
      // The B2B checkout flow never writes a personal shippingAddress name onto the cart
      // (it only sets billing), so order.shippingAddress carries no name to read here —
      // the logged-in user is the reliable source, same as the order history print path.
      buyerName: user?.fullName || [user?.firstName, user?.lastName].filter(Boolean).join(' '),
      organizationName: shopperContext?.organization?.name,
      paymentMethod: paymentMethodName,
    });

    downloadReceipt({ data: receiptData, labels });
  };

  const onOpenDashboard = () => {
    if (!dashboardDestination) {
      return;
    }

    // Respect the authored target: both links are currently set to open in a new tab.
    if (dashboardLink?.target === '_blank') {
      window.open(dashboardDestination, '_blank', 'noopener,noreferrer');
      return;
    }

    router.push(dashboardDestination);
  };

  const showSupportLine = Boolean(labels?.supportLinkLabel || labels?.supportPhoneCopy);

  return (
    <div className="flex flex-col items-center mx-5 md:mx-16 my-10 md:my-15 gap-10">
      <div className="flex flex-col items-center w-full gap-10">
        <div className="flex flex-col items-center gap-4 text-center">
          {/*
            The circle is drawn here rather than with TickFilledIcon: that icon's backing
            rect is sized in viewBox units, so it only renders correctly at size={14}.
          */}
          <span className="w-16 h-16 rounded-full bg-isc2-green bg-opacity-10 flex items-center justify-center">
            <TickIcon size={32} />
          </span>
          <h1 className="headline-xl md:headline-xxl">{label('businessHeadline')}</h1>
          <p className="body-l">{label('businessSubheadline')}</p>
          <p className="body-m text-gray-90 max-w-2xl">
            {label('businessConfirmationCopy').replace('{userEmail}', order.customerEmail ?? '')}
          </p>
        </div>

        <section className="border border-gray-70 rounded-lg px-6 py-8 md:p-10 bg-white flex flex-col w-full max-w-686 gap-6">
          <div className="flex justify-between gap-4">
            <div className="flex flex-col">
              <span className="body-s text-gray-90">{label('orderNumberLabel')}</span>
              <span className="text-xl font-bold break-all">{order.orderNumber}</span>
            </div>
            <div className="flex flex-col text-right">
              <span className="body-s text-gray-90">{label('orderDateLabel')}</span>
              <span className="text-xl font-bold">{formatDate({ value: order.createdAt })}</span>
            </div>
          </div>

          <ul className="flex flex-col gap-5 border-t border-gray-50 pt-6">
            {lineItems.map((lineItem) => {
              const unitPrice =
                'price' in lineItem
                  ? lineItem.price.discounted?.value || lineItem.price.value
                  : undefined;

              return (
                <li key={lineItem.id} className="flex justify-between gap-4">
                  <div className="flex flex-col">
                    <span className="body-m font-bold">{lineItem.name}</span>
                    <span className="body-s text-gray-90">
                      {label(
                        lineItem.quantity === 1 ? 'quantitySingularLabel' : 'quantityLabel'
                      ).replace('{quantity}', String(lineItem.quantity))}
                      {unitPrice && (
                        <>
                          {'  '}
                          {label('unitPriceLabel').replace('{price}', formatMoney(unitPrice))}
                        </>
                      )}
                    </span>
                  </div>
                  <span className="body-m font-bold text-isc2-green whitespace-nowrap">
                    {formatMoney(lineItem.totalPrice)}
                  </span>
                </li>
              );
            })}
          </ul>

          <div className="flex flex-col gap-2 border-t border-gray-50 pt-6">
            <div className="flex justify-between body-m">
              <span>{label('subtotalLabel')}</span>
              <span>
                {currencySymbol}
                {activeCart.computed.subtotal?.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between body-m">
              <span>{label('taxLabel')}</span>
              <span>
                {currencySymbol}
                {activeCart.computed.taxValue}
              </span>
            </div>
            <div className="flex justify-between text-xl font-bold pt-2">
              <span>{label('totalLabel')}</span>
              <span className="text-isc2-green">
                {currencySymbol}
                {activeCart.computed.totalPrice}
              </span>
            </div>
          </div>

          {paymentMethodName && (
            <div className="flex justify-between gap-4 border-t border-gray-50 pt-6 body-m">
              <span className="text-gray-90">{label('paymentMethodLabel')}</span>
              <span className="font-bold text-right">{paymentMethodName}</span>
            </div>
          )}
        </section>

        <section className="border border-gray-70 rounded-lg px-6 py-8 md:p-10 bg-white flex flex-col w-full max-w-686 gap-6">
          <h2 className="headline-s md:headline-m">{label('whatHappensNextTitle')}</h2>
          <ol className="flex flex-col gap-5">
            {whatHappensNextSteps.map((step, index) => (
              <li key={step.key} className="flex gap-4">
                <span
                  aria-hidden
                  className="shrink-0 w-6 h-6 rounded-full bg-isc2-green bg-opacity-10 text-isc2-green flex items-center justify-center body-s font-bold"
                >
                  {index + 1}
                </span>
                <div className="flex flex-col">
                  <span className="body-m font-bold">{step.title}</span>
                  <span className="body-s text-gray-90">{step.copy}</span>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-686 print:hidden">
        <Button
          type="button"
          variant="secondary"
          label={label('printReceiptCtaLabel')}
          onClick={onPrintReceipt}
          isLoading={isGeneratingReceipt}
          className="!self-auto flex-1 justify-center"
        />
        {Boolean(dashboardDestination) && (
          <Button
            type="button"
            variant="primary"
            label={label('openDashboardCtaLabel')}
            onClick={onOpenDashboard}
            className="!self-auto flex-1 justify-center"
          />
        )}
      </div>

      {showSupportLine && (
        <p className="body-s text-gray-90 text-center print:hidden">
          {label('supportCopy')}{' '}
          {labels?.supportLinkLabel && labels?.supportLinkUrl && (
            <a href={labels.supportLinkUrl} className="text-link-blue hover:underline">
              {labels.supportLinkLabel}
            </a>
          )}
          {labels?.supportPhoneCopy && <span> {labels.supportPhoneCopy}</span>}
        </p>
      )}
    </div>
  );
};

export default BusinessOrderDetailsContent;
