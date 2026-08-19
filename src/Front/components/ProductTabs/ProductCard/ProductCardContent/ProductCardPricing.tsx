import clsx from 'clsx';
import { CUSTOMER_PRICING_GROUP_MAP } from 'types/index';
import { Field, TextField } from '@sitecore-jss/sitecore-jss-nextjs';

import { useStandalonePrices, useUserSession } from 'providers/index';
import { areEqualPrices, isProductFreeForUser, parsePrice } from 'utils/index';
import { useLoggedUser } from 'hooks/index';
import { StandalonePrice, StandalonePriceMapping } from 'types/index';
import { FREE_PRICE } from 'constants/index';
import { useMemo } from 'react';

export namespace ProductCardPricing {
  export type Props = {
    regularPriceText: TextField;
    candidatePriceText: TextField;
    memberPriceText: TextField;
    associatePriceText: TextField;
    isForFreeText: Field<string>;
    isLoading?: boolean;
    prices?: StandalonePriceMapping['key'];
  };
}

export const ProductCardPricing = ({
  regularPriceText,
  memberPriceText,
  candidatePriceText,
  associatePriceText,
  isForFreeText,
  isLoading = false,
  prices = {},
}: ProductCardPricing.Props) => {
  const { isUserCandidate, isUserMember, isUserAssociate, isRegisterUser, isUserNotLoggedIn } =
    useLoggedUser();
  const { showPriceForRole, isGettingPricesForRole } = useStandalonePrices();

  const {
    showRegularPrice,
    showCandidatesPrice,
    showMembersPrice,
    showAssociatesPrice,
    isAnyFree,
  } = useMemo(() => {
    const regularPrice = prices[CUSTOMER_PRICING_GROUP_MAP.NON_MEMBERS];
    const candidatePrice = prices[CUSTOMER_PRICING_GROUP_MAP.CANDIDATES];
    const memberPrice = prices[CUSTOMER_PRICING_GROUP_MAP.MEMBERS];
    const associatePrice = prices[CUSTOMER_PRICING_GROUP_MAP.ASSOCIATES];

    const freeForRegularUser = isProductFreeForUser(regularPrice, isRegisterUser);
    const freeForMemberUser = isProductFreeForUser(memberPrice, isUserMember);
    const freeForCandidateUser = isProductFreeForUser(candidatePrice, isUserCandidate);
    const freeForAssociateUser = isProductFreeForUser(associatePrice, isUserAssociate);

    const isAnyFree =
      freeForRegularUser || freeForMemberUser || freeForCandidateUser || freeForAssociateUser;

    const isPriceValuesEqualInRoles =
      isUserNotLoggedIn && areEqualPrices([regularPrice, candidatePrice, memberPrice]);

    const showRegularPrice = Boolean(regularPrice) && showPriceForRole.forRegularUser;
    const showCandidatesPrice =
      Boolean(candidatePrice) && !isPriceValuesEqualInRoles && showPriceForRole.forCandidateUser;
    const showMembersPrice =
      Boolean(memberPrice) && !isPriceValuesEqualInRoles && showPriceForRole.forMemberUser;
    const showAssociatesPrice =
      Boolean(associatePrice) && !isPriceValuesEqualInRoles && showPriceForRole.forAssociateUser;

    return {
      showRegularPrice,
      showCandidatesPrice,
      showMembersPrice,
      showAssociatesPrice,
      isAnyFree,
    };
  }, [
    isRegisterUser,
    isUserAssociate,
    isUserCandidate,
    isUserMember,
    prices,
    showPriceForRole,
    isUserNotLoggedIn,
  ]);

  if (isLoading || isGettingPricesForRole) {
    const loaderSize = (isUserNotLoggedIn && 3) || 1;
    const loaderPlaceholders = [];
    for (let i = 0; i < loaderSize; i++) {
      loaderPlaceholders.push(
        <span key={`price-loader-${i}`} className="rounded-md bg-gray-30 h-5 w-full" />
      );
    }
    return (
      <section
        className={clsx(
          'mt-6 flex flex-col space-y-2 animate-pulse w-full',
          isUserNotLoggedIn ? 'h-21.25' : 'h-[1.4375rem]'
        )}
      >
        {loaderPlaceholders}
      </section>
    );
  }

  if (isAnyFree) {
    return (
      <section className="mt-6 h-21.25 w-full flex justify-end items-end">
        <span className="text-sm break-words text-isc2-green font-semibold">
          {isForFreeText.value}
        </span>
      </section>
    );
  }

  if (!showRegularPrice && !showCandidatesPrice && !showMembersPrice && !showAssociatesPrice) {
    return null;
  }

  return (
    <section className="mt-6 space-y-2">
      {showRegularPrice && (
        <ProductCardPriceLine
          textClassName="!text-black"
          title={regularPriceText?.value}
          price={prices[CUSTOMER_PRICING_GROUP_MAP.NON_MEMBERS]}
        />
      )}

      {showCandidatesPrice && (
        <ProductCardPriceLine
          freeText={isForFreeText.value}
          title={candidatePriceText?.value}
          price={prices[CUSTOMER_PRICING_GROUP_MAP.CANDIDATES]}
        />
      )}

      {showMembersPrice && (
        <ProductCardPriceLine
          freeText={isForFreeText.value}
          title={memberPriceText?.value}
          price={prices[CUSTOMER_PRICING_GROUP_MAP.MEMBERS]}
        />
      )}

      {showAssociatesPrice && (
        <ProductCardPriceLine
          freeText={isForFreeText.value}
          title={associatePriceText?.value}
          price={prices[CUSTOMER_PRICING_GROUP_MAP.ASSOCIATES]}
        />
      )}
    </section>
  );
};

export namespace ProductCardPriceLine {
  export type Props = {
    title?: string | number | undefined;
    price?: StandalonePrice;
    textClassName?: string;
    freeText?: string;
  };
}

const ProductCardPriceLine = ({
  title,
  price,
  textClassName,
  freeText,
}: ProductCardPriceLine.Props) => {
  const { currencySymbol } = useUserSession();

  if (!price) {
    return null;
  }

  const listPrice = parsePrice(price.value.centAmount, price.value.fractionDigits);
  const discountPrice = parsePrice(
    price.discounted?.value.centAmount,
    price.discounted?.value.fractionDigits
  );

  const isFreePrice =
    (listPrice === FREE_PRICE || (price.discounted && discountPrice === FREE_PRICE)) && freeText;

  return (
    <p className={clsx('flex justify-between space-x-2 text-isc2-green', textClassName)}>
      <span className="text-sm break-words flex-1 font-semibold">{title}</span>
      {isFreePrice && (
        <span
          className={clsx(
            'whitespace-nowrap body-m text-sm-base font-semibold',
            Boolean(price.discounted) && 'line-through !font-normal'
          )}
        >
          {freeText}
        </span>
      )}
      {!isFreePrice && (
        <>
          <span
            className={clsx(
              'whitespace-nowrap body-m text-sm-base font-semibold',
              Boolean(price.discounted) && 'line-through !font-normal'
            )}
          >
            {currencySymbol}
            {listPrice}
          </span>
          {Boolean(price.discounted && price.discounted.value) && (
            <span className="whitespace-nowrap body-m text-sm-base text-discount font-semibold">
              {currencySymbol}
              {discountPrice}
            </span>
          )}
        </>
      )}
    </p>
  );
};
