import { useGetAllStates, useLoggedUser } from 'hooks/index';
import { getActiveState, parseFieldsFromURLString } from 'utils/index';

import { ProfileInfoAddress } from '../../Base/ProfileInfoAddress';
import { ProfileSection } from '../../Base/ProfileSection';
import { AddressInformationLabels } from '../../profile.types';
import { AddressInformationForm } from './AddressInformationForm';
import { useMemo } from 'react';
import { UserAddress } from 'types/index';

export namespace AddressInformationSection {
  export type Props = {
    cancelText: string;
    saveChangesText: string;
    labelsAndTooltips: string;
    onSuccessfulEdit: () => void;
    onErrorEdit: () => void;
  };
}

export const AddressInformationSection = (props: AddressInformationSection.Props) => {
  const { user } = useLoggedUser();
  const { allStates } = useGetAllStates();

  const labels = parseFieldsFromURLString<AddressInformationLabels>({
    value: props.labelsAndTooltips,
  });

  const mailingState = useMemo(() => {
    return user?.mailingAddress
      ? getActiveState(
          allStates,
          user?.mailingAddress?.stateCode,
          user?.mailingAddress?.countryCode
        )
      : '';
  }, [user?.mailingAddress, allStates]);

  const billingState = useMemo(() => {
    return user?.billingAddress
      ? getActiveState(
          allStates,
          user?.billingAddress?.stateCode,
          user?.billingAddress?.countryCode
        )
      : '';
  }, [user?.billingAddress, allStates]);

  return (
    <ProfileSection
      heading={{ value: labels.addressInformationHeading }}
      editCta={{ value: { text: labels.addressInformationEditCtaLabel } }}
    >
      {({ editMode, cancelEditMode }) => {
        if (editMode) {
          return (
            <AddressInformationForm
              labels={labels}
              cancelText={props.cancelText}
              saveChangesText={props.saveChangesText}
              editMode={editMode}
              cancelEditMode={cancelEditMode}
              onSuccessfulEdit={props.onSuccessfulEdit}
              onErrorEdit={props.onErrorEdit}
            />
          );
        }

        return (
          <div className="flex flex-col space-y-5 mt-5">
            <ProfileInfoAddress
              address={
                {
                  ...user?.mailingAddress,
                  state: mailingState,
                } as UserAddress
              }
              title={labels.mailingAddressText}
            />
            <ProfileInfoAddress
              address={
                {
                  ...user?.billingAddress,
                  state: billingState,
                } as UserAddress
              }
              title={labels.billingAddressText}
            />
          </div>
        );
      }}
    </ProfileSection>
  );
};
