import { Field, LinkField, TextField } from '@sitecore-jss/sitecore-jss-nextjs';
import { useGetSubscriptions } from 'hooks/index';
import { useModal } from 'providers/index';
import { useCallback, useEffect, useMemo } from 'react';
import { parseFieldsFromURLString } from 'utils/index';
import MyAccountModal from '../MyAccountModal';
import { useSearchParams } from 'next/navigation';
import { ALLOCATION_ID } from 'constants/index';

interface SuspendedAccountModalProps {
  fields: {
    labelsTooltipsAndMore: Field<string>;
    heading: TextField;
    description: TextField;
    redirectLink?: LinkField;
  };
}

interface SuspendedAccountModalLabels {
  importantNoticeTitle: string;
  goToDashboardButtonLabel: string;
}

export default function SuspendedAccountModal({ fields }: SuspendedAccountModalProps) {
  const { setModalContent, closeModal } = useModal();
  const { isSuspended, isGettingSubscriptions } = useGetSubscriptions();
  const searchParams = useSearchParams();

  const labels = useMemo(
    () => parseFieldsFromURLString<SuspendedAccountModalLabels>(fields?.labelsTooltipsAndMore),
    [fields.labelsTooltipsAndMore]
  );

  const redirectLink = fields.redirectLink?.value.href;

  const SuspendedAccountModalContent = useCallback(() => {
    return (
      <MyAccountModal
        heading={fields.heading}
        description={fields.description}
        noticeLabel={labels.importantNoticeTitle}
        redirectLink={redirectLink}
        confirmActionLabel={labels.goToDashboardButtonLabel}
        confirmAction={closeModal}
      />
    );
  }, [
    closeModal,
    fields.description,
    fields.heading,
    labels.goToDashboardButtonLabel,
    labels.importantNoticeTitle,
    redirectLink,
  ]);

  useEffect(() => {
    // To avoid conflicting modals when redeeming allocation
    const allocationId = searchParams?.get(ALLOCATION_ID);

    if (isGettingSubscriptions || !isSuspended || allocationId) {
      return;
    }

    setModalContent(<SuspendedAccountModalContent />, {
      dismissOnClickOutside: !Boolean(redirectLink),
    });
  }, [
    SuspendedAccountModalContent,
    isGettingSubscriptions,
    isSuspended,
    redirectLink,
    searchParams,
    setModalContent,
  ]);
}
