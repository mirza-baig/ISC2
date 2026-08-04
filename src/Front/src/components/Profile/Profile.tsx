import { Field, LinkField } from '@sitecore-jss/sitecore-jss-nextjs';
import { useCallback } from 'react';

import { FormFieldsProvider, useLayout } from 'providers/index';
import { parseFieldsFromURLString } from 'utils/index';
import { useGetAllCountries, useGetAllStates, useLoggedUser } from 'hooks/index';
import { LoadingIndicator } from 'ui/index';
import ProfilePreferences, { PreferenceSection } from './Sections/ProfilePreferences';

import { AddressInformationSection } from './Sections/AddressInformationSection/AddressInformationSection';
import { ContactInformationSection } from './Sections/ContactInformationSection/ContactInformationSection';
import { EmploymentInformationSection } from './Sections/EmploymentInformationSection/EmploymentInformationSection';
import { EmailAddressSection } from './Sections/EmailAddressSection';
import { PasswordInformationSection } from './Sections/PasswordInformationSection';

interface AllSectionsLabels {
  passwordHeading: string;
  cancelText: string;
  saveChangesText: string;
  requiredFieldLabel: string;
  successConfirmationMessage: string;
  errorEditingMessage: string;
  requiredErrorMessage: string;
  incorrectPostalCodeMessage: string;
  emailFormatErrorMessage: string;
  dropdownPlaceholder: string;
}

interface ProfileProps {
  fields?: {
    addressInfoLabelsAndTooltips: Field<string>;
    contactInfoLabelsAndTooltips: Field<string>;
    emailAddressEditCta: LinkField;
    emailAddressLabelsAndTooltips: Field<string>;
    employmentInfoLabelsAndTooltips: Field<string>;
    howToEditNameCta?: LinkField;
    otherLabelsTitlesAndMore: Field<string>;
    passwordEditCta: LinkField;
    preferencesData?: {
      sections: PreferenceSection[];
      sectionTitle: Field<string>;
      alertLabels: {
        value: string;
      };
      mfaSettingsText?: {
        value: string;
      };
      mfaTitle?: {
        value: string;
      };
      mfaDescription?: {
        value: string;
      };
    };
  };
}

const Profile = ({ fields }: ProfileProps) => {
  const { addFlashAlert } = useLayout();
  const { isGettingUser } = useLoggedUser();
  const { isGettingAllCountries } = useGetAllCountries();
  const { isGettingAllStates } = useGetAllStates();

  const allSectionsLabels = parseFieldsFromURLString<AllSectionsLabels>(
    fields?.otherLabelsTitlesAndMore
  );

  const onSuccessfulEdit = useCallback(() => {
    addFlashAlert({
      type: 'success',
      label: allSectionsLabels.successConfirmationMessage,
      closable: true,
    });
  }, [addFlashAlert, allSectionsLabels.successConfirmationMessage]);

  const onErrorEdit = useCallback(() => {
    addFlashAlert({
      type: 'error',
      label: allSectionsLabels.errorEditingMessage,
      closable: true,
    });
  }, [addFlashAlert, allSectionsLabels.errorEditingMessage]);

  if (!fields) {
    return null;
  }

  if (isGettingUser || isGettingAllCountries || isGettingAllStates) {
    return (
      <main className="w-full flex justify-center">
        <LoadingIndicator />
      </main>
    );
  }

  return (
    <>
      <FormFieldsProvider
        requiredText={allSectionsLabels.requiredFieldLabel}
        requiredErrorMessage={allSectionsLabels.requiredErrorMessage}
        incorrectPostalCodeMessage={allSectionsLabels.incorrectPostalCodeMessage}
        emailFormatErrorMessage={allSectionsLabels.emailFormatErrorMessage}
        dropdownPlaceholder={allSectionsLabels.dropdownPlaceholder}
      >
        <main className="w-full flex flex-col space-y-12 md:space-y-15">
          <section className="w-full rounded-xl flex flex-col border divide-y">
            <ContactInformationSection
              onSuccessfulEdit={onSuccessfulEdit}
              onErrorEdit={onErrorEdit}
              cancelText={allSectionsLabels.cancelText}
              saveChangesText={allSectionsLabels.saveChangesText}
              labelsAndTooltips={fields.contactInfoLabelsAndTooltips.value}
              howToEditNameCta={fields.howToEditNameCta}
            />

            <EmailAddressSection
              cancelText={allSectionsLabels.cancelText}
              saveChangesText={allSectionsLabels.saveChangesText}
              editCta={fields.emailAddressEditCta}
              labelsAndTooltips={fields.emailAddressLabelsAndTooltips.value}
            />

            <AddressInformationSection
              onSuccessfulEdit={onSuccessfulEdit}
              onErrorEdit={onErrorEdit}
              cancelText={allSectionsLabels.cancelText}
              saveChangesText={allSectionsLabels.saveChangesText}
              labelsAndTooltips={fields.addressInfoLabelsAndTooltips.value}
            />

            <EmploymentInformationSection
              onSuccessfulEdit={onSuccessfulEdit}
              onErrorEdit={onErrorEdit}
              cancelText={allSectionsLabels.cancelText}
              saveChangesText={allSectionsLabels.saveChangesText}
              labelsAndTooltips={fields.employmentInfoLabelsAndTooltips.value}
            />

            <PasswordInformationSection
              heading={allSectionsLabels.passwordHeading}
              editCta={fields.passwordEditCta}
            />
          </section>
        </main>
      </FormFieldsProvider>
      {fields?.preferencesData && <ProfilePreferences fields={fields.preferencesData} />}
    </>
  );
};

export default Profile;
