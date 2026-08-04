import { LinkField } from '@sitecore-jss/sitecore-jss-nextjs';

import { useLoggedUser } from 'hooks/index';

import { ProfileInfoLabel } from '../../Base/ProfileInfoLabel';
import { ProfileSection } from '../../Base/ProfileSection';
import { ContactInformationLabels } from '../../profile.types';
import { ContactInformationForm } from './ContactInformationForm';
import { parseFieldsFromURLString } from 'utils/index';

export namespace ContactInformationSection {
  export type Props = {
    cancelText: string;
    saveChangesText: string;
    labelsAndTooltips: string;
    howToEditNameCta?: LinkField;
    onSuccessfulEdit: () => void;
    onErrorEdit: () => void;
  };
}

export const ContactInformationSection = (props: ContactInformationSection.Props) => {
  const { user } = useLoggedUser();

  const labels = parseFieldsFromURLString<ContactInformationLabels>({
    value: props.labelsAndTooltips,
  });

  const getHowToEditNameInstructions = () => {
    if (props.howToEditNameCta?.value) {
      return labels.howToEditNameNotice.replace(
        '{howToEditNameCta}',
        `<a href="${props.howToEditNameCta.value.url}">${props.howToEditNameCta.value.text}</a>`
      );
    }

    return '';
  };

  return (
    <ProfileSection
      heading={{ value: labels.contactInformationHeading }}
      editCta={{ value: { text: labels.contactInformationEditCtaLabel } }}
    >
      {({ editMode, cancelEditMode }) => {
        if (editMode) {
          return (
            <ContactInformationForm
              labels={{ ...labels, howToEditNameNotice: getHowToEditNameInstructions() }}
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
            <ProfileInfoLabel>{user?.fullName}</ProfileInfoLabel>
            {user?.prefix && (
              <ProfileInfoLabel>{`${labels.prefixLabel}: ${user.prefix}`}</ProfileInfoLabel>
            )}
            {user?.suffix && (
              <ProfileInfoLabel>{`${labels.suffixLabel}: ${user.suffix}`}</ProfileInfoLabel>
            )}
            {user?.nickname && (
              <ProfileInfoLabel>{`${labels.nicknameLabel}: ${user.nickname}`}</ProfileInfoLabel>
            )}
            {user?.pronouns && (
              <ProfileInfoLabel>{`${labels.pronounLabel}: ${user.pronouns}`}</ProfileInfoLabel>
            )}
            <ProfileInfoLabel>{user?.phoneNumber}</ProfileInfoLabel>
          </div>
        );
      }}
    </ProfileSection>
  );
};
