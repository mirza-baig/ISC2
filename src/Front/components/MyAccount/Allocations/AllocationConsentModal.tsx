import { LinkField, TextField } from '@sitecore-jss/sitecore-jss-nextjs';
import { useModal, useUserSession } from 'providers/index';
import { useCallback, useEffect } from 'react';
import AllocationConsentModalContent from './AllocationConsentModalContent';
import { useRouter } from 'next/navigation';
import { useAcceptTermsAndConditions } from 'hooks/index';

export type AllocationModalFields = {
  heading: TextField;
  description: TextField;
  primaryCtaLabel: TextField;
  secondaryCta: LinkField;
};

type AllocationDetailsProps = {
  fields: AllocationModalFields;
};

export default function AllocationConsentModal({ fields }: AllocationDetailsProps) {
  const { heading, description, primaryCtaLabel, secondaryCta } = fields;
  const { setModalContent, closeModal } = useModal();
  const { isConsentAllocation, setIsConsentAllocation } = useUserSession();
  const {
    acceptTermsAndConditionsAsync,
    isAcceptingTermsAndConditions,
    acceptTermsAndConditionsError,
  } = useAcceptTermsAndConditions();
  const router = useRouter();

  const agreeConsentAction = useCallback(async () => {
    const isSuccess = await acceptTermsAndConditionsAsync({
      isConsentAccepted: true,
    });

    if (isSuccess) {
      setIsConsentAllocation(true);
      closeModal();
    }
  }, [acceptTermsAndConditionsAsync, closeModal, setIsConsentAllocation]);

  const disagreeConsentAction = useCallback(async () => {
    setIsConsentAllocation(false);
    await acceptTermsAndConditionsAsync({
      isConsentAccepted: false,
    });
    router.replace(secondaryCta?.value?.href || '/');
  }, [acceptTermsAndConditionsAsync, router, secondaryCta, setIsConsentAllocation]);

  useEffect(() => {
    if (!Boolean(isConsentAllocation)) {
      setModalContent(
        <AllocationConsentModalContent
          heading={heading}
          description={description}
          primaryCtaLabel={primaryCtaLabel}
          secondaryCtaLabel={secondaryCta}
          agreeConsentAction={agreeConsentAction}
          disagreeConsentAction={disagreeConsentAction}
          isAcceptingTermsAndConditions={isAcceptingTermsAndConditions}
          acceptTermsAndConditionsError={acceptTermsAndConditionsError}
        />,
        {
          dismissOnClickOutside: false,
        }
      );
    }

    return;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    acceptTermsAndConditionsError,
    agreeConsentAction,
    description,
    disagreeConsentAction,
    heading,
    isConsentAllocation,
    primaryCtaLabel,
    secondaryCta,
    setModalContent,
  ]);

  return null;
}
