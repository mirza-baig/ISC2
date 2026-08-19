import { useLoggedUser } from 'hooks/index';
import { parseFieldsFromURLString } from 'utils/index';

import { ProfileInfoLabel } from '../../Base/ProfileInfoLabel';
import { ProfileSection } from '../../Base/ProfileSection';
import { EmploymentInformationLabels } from '../../profile.types';
import { EmploymentInformationForm } from './EmploymentInformationForm';

export namespace EmploymentInformationSection {
  export type Props = {
    cancelText: string;
    saveChangesText: string;
    labelsAndTooltips: string;
    onSuccessfulEdit: () => void;
    onErrorEdit: () => void;
  };
}

export const EmploymentInformationSection = (props: EmploymentInformationSection.Props) => {
  const { user } = useLoggedUser();

  const labels = parseFieldsFromURLString<EmploymentInformationLabels>({
    value: props.labelsAndTooltips,
  });

  return (
    <ProfileSection
      heading={{ value: labels.employmentInformationHeading }}
      editCta={{ value: { text: labels.employmentInformationEditCtaLabel } }}
    >
      {({ editMode, cancelEditMode }) => {
        if (editMode) {
          return (
            <EmploymentInformationForm
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
          <div className="flex flex-col space-y-0.5">
            <ProfileInfoLabel>{user?.employer}</ProfileInfoLabel>
            <ProfileInfoLabel>{user?.jobTitle}</ProfileInfoLabel>
            <ProfileInfoLabel>{user?.workEmail}</ProfileInfoLabel>
            <ProfileInfoLabel>{user?.workPhone}</ProfileInfoLabel>
            {user?.isGovernmentContractor && (
              <ProfileInfoLabel>{labels.governmentContractorSwitchLabel}</ProfileInfoLabel>
            )}
            {user?.isGovernmentEmployee && (
              <ProfileInfoLabel>{labels.governmentEmployerSwitchLabel}</ProfileInfoLabel>
            )}
          </div>
        );
      }}
    </ProfileSection>
  );
};
