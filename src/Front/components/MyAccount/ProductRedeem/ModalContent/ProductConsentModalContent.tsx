import { LinkFieldValue } from '@sitecore-jss/sitecore-jss-nextjs';
import { ProductRedeemLabels } from '../ProductRedeemModal';
import MyAccountModal from '../../MyAccountModal';
import { useLoggedUser } from 'hooks/index';
import { useState } from 'react';
import { GenericModal } from 'ui/index';

export namespace ProductConsentModalContent {
  export type Props = {
    labels: ProductRedeemLabels;
    acceptAllocation: () => void;
    isAcceptingAllocation: boolean;
  };
}

export default function ProductConsentModalContent(
  { labels, acceptAllocation, isAcceptingAllocation } = ProductConsentModalContent.Props
) {
  const { user } = useLoggedUser();
  const [showWarning, setShowWarning] = useState(false);

  if (showWarning) {
    const goBackLabel = (() => {
      const val = labels.disagreementWarningGoBackCtaLabel?.value;
      return (typeof val === 'object' ? (val as LinkFieldValue)?.text : val)?.toString() || '';
    })();

    return (
      <GenericModal
        description={labels.disagreementWarningBody?.value?.toString() || ''}
        primaryCtaLabel={labels.disagreementWarningConfirmCtaLabel?.value?.toString() || ''}
        onPrimaryCtaClick={() => acceptAllocation({ consent: false })}
        onSecondaryCtaClick={() => setShowWarning(false)}
        secondaryCtaLabel={goBackLabel}
      />
    );
  }

  return (
    <MyAccountModal
      heading={labels.consentHeading}
      description={{
        value: labels.consentBodyText.value
          ?.toString()
          .replace('{employerName}', user?.employer || 'your employer'),
      }}
      confirmActionLabel={labels.consentAgreementCtaLabel.value?.toString() || ''}
      confirmAction={() => acceptAllocation({ consent: true })}
      cancelActionLabel={labels.consentDisagreementCtaLabel.value?.toString() || ''}
      cancelAction={() => setShowWarning(true)}
      additionalClasses={'!sm:max-w-none'}
      isLoading={isAcceptingAllocation}
    />
  );
}
