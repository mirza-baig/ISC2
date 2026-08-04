import MyAccountModal from '../MyAccountModal';
import { AllocationModalFields } from './AllocationConsentModal';
import useLoggedUser from 'hooks/useLoggedUser';

export namespace AllocationConsentModalContent {
  export type Props = AllocationModalFields & {
    isAcceptingTermsAndConditions: boolean;
    acceptTermsAndConditionsError: string;
    agreeConsentAction: () => void;
    disagreeConsentAction: () => void;
  };
}

export default function AllocationConsentModalContent(
  {
    heading,
    description,
    primaryCtaLabel,
    secondaryCtaLabel,
    agreeConsentAction,
    disagreeConsentAction,
    isAcceptingTermsAndConditions,
    acceptTermsAndConditionsError,
  } = AllocationConsentModalContent.Props
) {
  const { user, isGettingUser } = useLoggedUser();

  return (
    <MyAccountModal
      heading={heading?.value}
      description={{
        value: description?.value
          .toString()
          .replaceAll('{companyName}', user?.employer ?? 'Company'),
      }}
      confirmActionLabel={primaryCtaLabel?.value}
      confirmAction={agreeConsentAction}
      cancelActionLabel={secondaryCtaLabel?.value?.text}
      cancelAction={disagreeConsentAction}
      isLoading={isGettingUser || isAcceptingTermsAndConditions}
      noticeLabel={acceptTermsAndConditionsError}
    />
  );
}
