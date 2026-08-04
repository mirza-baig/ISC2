import clsx from 'clsx';
import { useMemo } from 'react';

import { useLoggedUser, useUserRoleValue } from 'hooks/index';
import { CERTIFICATION_STATUS_MAINTENANCE } from 'constants/index';

export namespace UserDataSummary {
  export interface Labels {
    uploadFileCtaLabel: string;
    dropFileText: string;
    userIdLabel: string;
    startDateLabel: string;
    recertifyDateLabel: string;
    renewalDateLabel: string;
    editPictureLabel: string;
    deletePictureLabel: string;
    closeLabel: string;
    validationLabel: string;
    deleteSuccessfulLabel: string;
    photoUploadLabel: string;
    validImageLabel: string;
    photoUploadSizeInMb: string;
  }

  export type Props = {
    className?: string;
    labels: Labels;
  };
}

export const UserDataSummary = ({ className, labels }: UserDataSummary.Props) => {
  const { user, isRegisterUser } = useLoggedUser();

  const membershipType = useUserRoleValue({
    memberValue: 'Member',
    candidateValue: 'Candidate',
    associateValue: 'Member',
    nonMemberValue: 'Non-Member',
    defaultValue: 'Non-Member',
  });

  // const subscriptionEndLabel = useUserRoleValue({
  //   memberValue: labels.recertifyDateLabel,
  //   candidateValue: labels.renewalDateLabel,
  //   associateValue: labels.recertifyDateLabel,
  //   defaultValue: '',
  // });

  const userTitle = useMemo(() => {
    const fullName = user?.fullName;
    const suffix = isRegisterUser
      ? ''
      : [
          ...new Set(
            user?.certifications
              ?.filter(
                (certification) => certification?.status === CERTIFICATION_STATUS_MAINTENANCE
              )
              ?.map(({ name }) => name)
          ),
        ].join(', ');

    return [fullName, suffix].filter(Boolean).join(', ');
  }, [isRegisterUser, user?.certifications, user?.fullName]);

  return (
    <div className={clsx('flex flex-col space-y-2', className)}>
      <p className="body-m whitespace-break-spaces font-bold">{userTitle}</p>

      <ul className="body-s text-gray-90">
        {user?.customerId && membershipType && (
          <li>
            <span>{labels.userIdLabel?.replace('{membershipType}', membershipType)}: </span>
            {user.customerId}
          </li>
        )}
        {/* CWPI-1843: ISC2 requested to comment since they want to bring back at some point */}
        {/* {(isUserMember || isUserCandidate || isUserAssociate) && (
          <>
            {user?.subscription?.startDate && (
              <li>
                <span>{labels.startDateLabel}: </span>
                {user?.subscription?.startDate}
              </li>
            )}
            {user?.subscription?.renewalDate && (
              <li>
                <span>{subscriptionEndLabel}: </span>
                {user?.subscription?.renewalDate}
              </li>
            )}
          </>
        )} */}
      </ul>
    </div>
  );
};
