import { Field, ImageField, RichTextField, TextField } from '@sitecore-jss/sitecore-jss-nextjs';
import { useCallback, useMemo } from 'react';
import { parseFieldsFromURLString } from 'utils/fields';
import useLoggedUser from 'hooks/useLoggedUser';
import {
  convertDateToReadableFormat,
  CurrencyCodes,
  getCurrencySymbol,
  parsePrice,
} from 'utils/index';
import { useCart, useLayout, useModal, useUserSession } from 'providers/index';
import { LoadingIndicator } from 'ui/index';
import {
  useAddToCart,
  useGetDistributionChannel,
  useGetProduct,
  useGetStandalonePrices,
  useGetSubscriptions,
} from 'hooks/index';
import { SUBSCRIPTION_PAYMENT_STATUS, SUBSCRIPTION_STATUS } from 'constants/account';
import { CUSTOMER_PRICING_GROUP_MAP } from 'types/index';
import MyAccountSectionCard from '../MyAccountSectionCard';
import MyAccountSectionContainer from '../MyAccountSectionContainer';
import MyAccountSectionFooter from '../MyAccountSectionFooter';
import { CurrencyMismatchModal } from 'components/Header/HeaderCurrencyDropdown/CurrencyMismatchModal';
import { useRouter } from 'next/router';

interface PaymentInformationProps {
  fields: {
    productImage: ImageField;
    examPassDueDateMessage: TextField;
    headline: TextField;
    labelsMessagesAndMore: Field<string>;
    cpeExpiredText: RichTextField;
    currencyChangeModal: {
      fields: {
        heading?: TextField;
        description?: RichTextField;
        primaryCtaLabel?: TextField;
        secondaryCtaLabel?: TextField;
      };
    };
  };
}

interface PaymentInformationLabels {
  payCtaLabel: string;
  dueDateMessage: string;
  pastDueMessage: string;
  pendingPaymentMessage: string;
  defaultMessage: string;
  productAddedToCartMessage: string;
  productNotAddedToCartMessage: string;
  productAlreadyAddedToCartMessage: string;
  cpeExpiredMessage: string;
}

const PaymentInformation = ({ fields }: PaymentInformationProps) => {
  const { isGettingUser, isUserAssociate, isUserCandidate, isUserMember } = useLoggedUser();
  const { currencyCode, setCurrencyCode } = useUserSession();
  const { activeCart } = useCart();
  const { setModalContent } = useModal();
  const { addFlashAlert } = useLayout();
  const router = useRouter();
  const { distributionChannel, isGettingDistributionChannel } = useGetDistributionChannel();
  const { subscription, isGettingSubscriptions, isPastDue } = useGetSubscriptions();
  const { product, isGettingProduct } = useGetProduct({ sku: subscription?.sku || '' });
  const { standalonePrices, isGettingStandalonePrices } = useGetStandalonePrices({
    skuList: [subscription?.sku || ''],
    distributionChannelId: distributionChannel?.id,
    customCurrencyCode: isPastDue ? CurrencyCodes.USD : currencyCode,
  });

  const labels = useMemo(
    () => parseFieldsFromURLString<PaymentInformationLabels>(fields?.labelsMessagesAndMore),
    [fields.labelsMessagesAndMore]
  );

  const onSuccessCallback = useCallback(() => {
    addFlashAlert({
      type: 'success',
      label: labels?.productAddedToCartMessage,
      closable: true,
    });
  }, [addFlashAlert, labels?.productAddedToCartMessage]);

  const onErrorCallback = useCallback(
    (errorCode: string) => {
      addFlashAlert({
        type: 'error',
        label: `${labels?.productNotAddedToCartMessage}: ${errorCode ?? 'DEFAULT_ERROR'}`,
        closable: true,
      });
    },
    [addFlashAlert, labels?.productNotAddedToCartMessage]
  );

  const { addToCart, isAddingToCart } = useAddToCart({
    onSuccess: onSuccessCallback,
    onError: onErrorCallback,
  });

  const containerTitle = fields.headline.value?.toString() || 'Payment Information';

  const price = useMemo(() => {
    if (!subscription || !standalonePrices || !standalonePrices[subscription?.sku])
      return undefined;

    if (isUserAssociate) {
      return standalonePrices[subscription.sku][CUSTOMER_PRICING_GROUP_MAP.ASSOCIATES].value;
    }

    if (isUserCandidate) {
      return standalonePrices[subscription.sku][CUSTOMER_PRICING_GROUP_MAP.CANDIDATES].value;
    }

    if (isUserMember) {
      return standalonePrices[subscription.sku][CUSTOMER_PRICING_GROUP_MAP.MEMBERS].value;
    }

    return standalonePrices[subscription.sku][CUSTOMER_PRICING_GROUP_MAP.NON_MEMBERS].value;
  }, [subscription, standalonePrices, isUserAssociate, isUserCandidate, isUserMember]);

  const message = useMemo(() => {
    if (!subscription?.paymentStatus || !subscription?.status) {
      return undefined;
    }

    if (subscription.AMFType === subscription.UpgradeAMFType) {
      if (
        subscription.status.toLowerCase() === SUBSCRIPTION_STATUS.active &&
        subscription.paymentStatus.toLowerCase() === SUBSCRIPTION_PAYMENT_STATUS.due
      ) {
        return {
          color: 'text-isc2-green',
          label: labels?.dueDateMessage.replace(
            '{dueDate}',
            convertDateToReadableFormat(subscription.subscriptionPaidThroughDate)
          ),
        };
      }

      if (
        [
          SUBSCRIPTION_STATUS.active,
          SUBSCRIPTION_STATUS.pending,
          SUBSCRIPTION_STATUS.suspended,
        ].includes(subscription.status.toLowerCase() as SUBSCRIPTION_STATUS) &&
        isPastDue
      ) {
        return {
          color: 'text-red-warning',
          label: labels?.pastDueMessage.replace(
            '{dueDate}',
            convertDateToReadableFormat(subscription.gracePeriodEndDate)
          ),
        };
      }

      if (subscription.cpeStatus === 'cpenotcomplete') {
        return {
          label: {
            value: fields.cpeExpiredText?.value?.replace(
              '{dueDate}',
              convertDateToReadableFormat(subscription.gracePeriodEndDate)
            ),
          },
        };
      }

      if (subscription.paymentStatus.toLowerCase() === SUBSCRIPTION_PAYMENT_STATUS.notDue) {
        return undefined;
      }
    }

    return {
      color: 'text-isc2-green',
      label: labels?.pendingPaymentMessage,
    };
  }, [fields.cpeExpiredText?.value, isPastDue, labels, subscription]);

  const data = useMemo(() => {
    return {
      name: product?.title || '',
      labels:
        subscription?.enrollmentStart && subscription?.enrollmentEnd
          ? [
              {
                content: `${convertDateToReadableFormat(
                  subscription?.enrollmentStart
                )} - ${convertDateToReadableFormat(subscription?.enrollmentEnd)}`,
              },
            ]
          : [],
      image: {
        src: fields.productImage.value?.src || '',
        alt: String(fields.productImage.value?.alt),
      },
      cta: {
        label: price
          ? `${getCurrencySymbol(price.currencyCode)} ${parsePrice(
              price.centAmount,
              price.fractionDigits
            )}`
          : '',
      },
      footerMessage: message,
    };
  }, [
    fields.productImage.value?.alt,
    fields.productImage.value?.src,
    message,
    price,
    product?.title,
    subscription?.enrollmentEnd,
    subscription?.enrollmentStart,
  ]);

  const isProductAlreadyInCart = useMemo(() => {
    return activeCart?.lineItems?.some((item) => item.variant.sku === subscription?.sku);
  }, [activeCart?.lineItems, subscription?.sku]);

  const addToCartAction = useCallback(
    (isAlreadyInCartError: boolean) => {
      if (!subscription?.sku) return;

      if (isAlreadyInCartError) {
        addFlashAlert({
          type: 'error',
          label: labels?.productAlreadyAddedToCartMessage,
          closable: true,
        });
        return;
      }

      // Custom request from ISC2's legal team to switch to USD if the subscription status is past due
      if (isPastDue) {
        setCurrencyCode(CurrencyCodes.USD);
      }

      addToCart({ items: [{ sku: subscription?.sku }] });

      if (isPastDue) {
        router.replace('/Cart');
      }
    },
    [
      addFlashAlert,
      addToCart,
      isPastDue,
      labels?.productAlreadyAddedToCartMessage,
      router,
      setCurrencyCode,
      subscription?.sku,
    ]
  );

  const handleClickPayButton = useCallback(() => {
    if (!subscription?.sku) return;

    // Custom request from ISC2's legal team to switch to USD if the subscription status is past due
    if (
      (!isPastDue &&
        !activeCart.computed.isEmpty &&
        activeCart.computed.currencyCode !== currencyCode) ||
      (isPastDue && activeCart.computed.currencyCode !== CurrencyCodes.USD)
    ) {
      const currencyModalFields = fields.currencyChangeModal?.fields;

      setModalContent(
        <CurrencyMismatchModal
          fields={{
            primaryCTA: {
              value: { text: currencyModalFields?.primaryCtaLabel?.value?.toString() },
            },
            secondaryCTA: {
              value: { text: currencyModalFields?.secondaryCtaLabel?.value?.toString() },
            },
            ...fields.currencyChangeModal?.fields,
          }}
          onConfirm={() => addToCartAction(false)}
        />
      );

      return;
    }

    addToCartAction(Boolean(isProductAlreadyInCart));
  }, [
    activeCart,
    addToCartAction,
    currencyCode,
    fields.currencyChangeModal?.fields,
    isPastDue,
    isProductAlreadyInCart,
    setModalContent,
    subscription?.sku,
  ]);

  if (!subscription?.paymentStatus || !subscription?.status) {
    return null;
  }

  if (
    isGettingUser ||
    isGettingDistributionChannel ||
    isGettingSubscriptions ||
    (subscription?.sku && isGettingStandalonePrices) ||
    isGettingProduct
  ) {
    return (
      <MyAccountSectionContainer fields={{ title: containerTitle }}>
        <LoadingIndicator className="self-center" />
      </MyAccountSectionContainer>
    );
  }

  if (!message) {
    return (
      <MyAccountSectionContainer fields={{ title: containerTitle }} containerClasses="h-full">
        <MyAccountSectionCard
          key={data?.name}
          fields={{
            name: labels?.defaultMessage,
            image: data?.image,
            isHalfCard: true,
            withBorder: false,
          }}
        />
      </MyAccountSectionContainer>
    );
  }

  return (
    <MyAccountSectionContainer fields={{ title: containerTitle }} containerClasses="h-full">
      <MyAccountSectionCard key={data?.name} fields={{ ...data, isHalfCard: true }} />
      <MyAccountSectionFooter
        primaryCTA={{
          href: '',
          label: labels.payCtaLabel,
          type: 'button',
          onClick: handleClickPayButton,
          isDisabled: isAddingToCart || !subscription.sku,
        }}
        label={data?.footerMessage?.label || ''}
        labelClasses={data?.footerMessage?.color || ''}
      />
    </MyAccountSectionContainer>
  );
};

export default PaymentInformation;
