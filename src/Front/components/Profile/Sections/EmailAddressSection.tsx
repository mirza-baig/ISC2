import { LinkField } from '@sitecore-jss/sitecore-jss-nextjs';

import { useLoggedUser } from 'hooks/index';
import { parseFieldsFromURLString } from 'utils/index';

import { ProfileSectionFooter } from '../Base/ProfileSectionFooter';
import { ProfileInfoLabel } from '../Base/ProfileInfoLabel';
import { ProfileSection } from '../Base/ProfileSection';

export namespace EmailAddressSection {
  export type Props = {
    editCta: LinkField;
    cancelText: string;
    saveChangesText: string;
    labelsAndTooltips: string;
  };

  export type Labels = {
    emailAddressHeading: string;
  };
}

export const EmailAddressSection = (props: EmailAddressSection.Props) => {
  const { user } = useLoggedUser();

  const labels = parseFieldsFromURLString<EmailAddressSection.Labels>({
    value: props.labelsAndTooltips,
  });

  return (
    <ProfileSection heading={{ value: labels.emailAddressHeading }} editCta={props.editCta}>
      {({ editMode, cancelEditMode }) => (
        <>
          <ProfileInfoLabel>{user?.email}</ProfileInfoLabel>

          {editMode && (
            <ProfileSectionFooter
              cancelText={props.cancelText}
              saveChangesText={props.saveChangesText}
              editMode={editMode}
              cancelEditMode={cancelEditMode}
            />
          )}
        </>
      )}
    </ProfileSection>
  );
};
