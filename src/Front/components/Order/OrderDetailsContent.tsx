import { ComponentRendering, Placeholder, RichText } from '@sitecore-jss/sitecore-jss-nextjs';
import { useMemo } from 'react';
import clsx from 'clsx';

import { useCart } from 'providers/index';
import { parseFieldsFromURLString } from 'utils/index';
import { OrderCompanyData, OrderWithComputedData } from 'types/index';
import { COMPANY_FIELDS, EXAM_PRODUCT_TYPES } from 'constants/index';

import { OrderDetailsFields } from './OrderDetails';
import ExamPurchasedCard from './ExamPurchasedCard';

interface OrderDetailsContentProps {
  rendering: ComponentRendering;
  fields: OrderDetailsFields;
  order: OrderWithComputedData;
}

type LabelsTooltipsAndMore = {
  appreciationMessageHeadline: string;
  orderNumberCopy: string;
  providedByLabel: string;
  printOrderCtaLabel: string;
  paymentSectionTitle: string;
  paymentWaitingApprovalNotice: string;
  shippingSectionTitle: string;
  summaryItemsLabel: string;
  summarySectionTitle: string;
  summaryTotalLabel: string;
  companySectionTitle: string;
};

const OrderDetailsContent = ({ fields, rendering, order }: OrderDetailsContentProps) => {
  const { activeCart } = useCart();

  const labelsTooltipsAndMore = parseFieldsFromURLString<LabelsTooltipsAndMore>(
    fields.labelsTooltipsAndMore
  );

  const appreciationMessage = fields?.appreciationMessage?.value?.replace(
    '{userEmail}',
    order.customerEmail
  );

  const orderNumberCopy = labelsTooltipsAndMore?.orderNumberCopy?.replace(
    '{orderId}',
    order.orderNumber
  );

  const showPaymentWaitingApprovalNotice = useMemo(
    () => order.paymentState?.toLowerCase() === 'pending',
    [order.paymentState]
  );

  const showExamPurchasedCard = activeCart.lineItems?.some(
    ({ productType }) => productType && EXAM_PRODUCT_TYPES.includes(productType.name.toLowerCase())
  );

  const companyInfo = useMemo(() => {
    if (activeCart.computed.isB2B && activeCart?.custom?.customFieldsRaw) {
      return activeCart.custom.customFieldsRaw.reduce((acc, item) => {
        if (COMPANY_FIELDS.includes(item.name)) {
          return {
            ...acc,
            [item.name]: item.value,
          };
        }
        return acc;
      }, {} as OrderCompanyData);
    }
    return {} as OrderCompanyData;
  }, [activeCart]);

  const paymentMethodName = useMemo(
    () => order.paymentInfo?.payments[0].paymentMethodInfo.name,
    [order.paymentInfo?.payments]
  );

  return (
    <div className="flex flex-col items-center mx-5 md:mx-16 my-10 md:my-15 gap-10 md:gap-15 border-b pb-15">
      <div className="flex flex-col space-y-7 md:space-y-8">
        {labelsTooltipsAndMore?.appreciationMessageHeadline && (
          <h1 className="headline-xl md:headline-xxl text-center">
            {labelsTooltipsAndMore.appreciationMessageHeadline}
          </h1>
        )}
        {appreciationMessage && order.customerEmail && (
          <RichText
            className="flex flex-col gap-7 body-l"
            field={{
              value: appreciationMessage,
            }}
          />
        )}
      </div>

      <div className="flex flex-col max-w-686 w-full gap-10">
        <div className="flex flex-col gap-5 items-center">
          {showExamPurchasedCard && !activeCart.computed.isB2B && (
            <ExamPurchasedCard message={fields?.purchaseConfirmationCopy} />
          )}
          {orderNumberCopy && (
            <h2 className="text-2xl md:text-3xl font-bold text-center break-all">
              {orderNumberCopy}
            </h2>
          )}
          {labelsTooltipsAndMore?.providedByLabel && (
            <span>{labelsTooltipsAndMore.providedByLabel}</span>
          )}
          {labelsTooltipsAndMore?.printOrderCtaLabel && (
            <button
              type="button"
              onClick={() => window.print()}
              className="cta secondary-cta py-3 px-5"
              aria-label={labelsTooltipsAndMore.printOrderCtaLabel}
            >
              {labelsTooltipsAndMore.printOrderCtaLabel}
            </button>
          )}
        </div>

        <section className="border border-gray-70 rounded-lg px-6 py-8 md:p-10 bg-white flex flex-col w-full md:w-3xl">
          <h3 className="headline-s md:headline-m mb-7">
            {labelsTooltipsAndMore.paymentSectionTitle}
          </h3>
          <div className="flex flex-col">
            {paymentMethodName && (
              <span className="text-base leading-5 mb-2">{paymentMethodName}</span>
            )}
            <span className={clsx('text-xl font-bold', showPaymentWaitingApprovalNotice && 'mb-7')}>
              {order.computed.currencySymbol} {activeCart.computed.totalPrice}
            </span>
            {showPaymentWaitingApprovalNotice && (
              <span className="text-xs text-red-warning bg-red-warning bg-opacity-10 px-2 py-1 rounded-tag w-fit">
                {labelsTooltipsAndMore.paymentWaitingApprovalNotice}
              </span>
            )}
          </div>
        </section>
        {Boolean(Object.keys(companyInfo).length) && (
          <section className="border border-gray-70 rounded-lg px-6 py-8 md:p-10 bg-white flex flex-col w-full md:w-3xl">
            <h3 className="headline-s md:headline-m mb-7">
              {labelsTooltipsAndMore.companySectionTitle}
            </h3>
            <div className="flex flex-col">
              {companyInfo.companyName && (
                <span className={clsx('body-m font-bold mb-2')}>{companyInfo.companyName}</span>
              )}
              <address className="not-italic body-m flex flex-col w-full space-y-2">
                {companyInfo.address && <span>{companyInfo.address}</span>}
                {companyInfo.zipCode && <span>{companyInfo.zipCode}</span>}
                {(companyInfo.city || companyInfo.state) && (
                  <span>{[companyInfo.city, companyInfo.state].join(', ')}</span>
                )}
                {companyInfo.country && <span>{companyInfo.country}</span>}
              </address>
            </div>
          </section>
        )}

        <Placeholder
          name="order-details-order-summary"
          rendering={rendering}
          params={{ showTaxes: 'true', showUserPriceLabel: 'true', orderDetailsMode: 'true' }}
        />
      </div>
    </div>
  );
};

export default OrderDetailsContent;
