import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useCallback } from 'react';

import { ContactInformation, ContactInformationSchema, ProfileFormSections } from 'types/index';
import { useLoggedUser, useUpdateUserData } from 'hooks/index';
import { getContactInformationFromUser } from 'utils/index';
import { RichTextUI, FormTextInput, FormDropdown } from 'ui/index';

import { ProfileSectionFooter } from '../../Base/ProfileSectionFooter';
import { ProfileSectionProps, ContactInformationLabels } from '../../profile.types';
import { getContactInformationFieldsDropdownOptions } from 'utils/account';

export namespace ContactInformationForm {
  export type Props = ProfileSectionProps & {
    labels: ContactInformationLabels;
    onSuccessfulEdit: () => void;
    onErrorEdit: () => void;
  };
}

export const ContactInformationForm = (props: ContactInformationForm.Props) => {
  const { user } = useLoggedUser();

  const onSuccessCallback = useCallback(() => {
    props.onSuccessfulEdit();
    props.cancelEditMode();
  }, [props]);

  const { updateUser, isUpdatingUser } = useUpdateUserData({
    onSuccess: onSuccessCallback,
    onError: props.onErrorEdit,
  });

  const {
    control,
    handleSubmit,
    formState: { isValid },
  } = useForm<ProfileFormSections>({
    mode: 'onSubmit',
    defaultValues: getContactInformationFromUser(user),
    resolver: zodResolver(ContactInformationSchema),
  });

  const onFormSubmit = useCallback(
    (data: ContactInformation) => {
      if (isUpdatingUser || !isValid) {
        return;
      }

      updateUser(data);
    },
    [updateUser, isUpdatingUser, isValid]
  );

  return (
    <form className="flex flex-col space-y-2 !mt-8 relative" onSubmit={handleSubmit(onFormSubmit)}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
        <FormDropdown
          control={control}
          name="prefix"
          options={getContactInformationFieldsDropdownOptions('prefix')}
          textProp="name"
          valueProp="value"
          label={props.labels.prefixLabel}
          disabled={isUpdatingUser}
          maxLength={80}
          isOptional
        />

        <FormDropdown
          control={control}
          name="suffix"
          options={getContactInformationFieldsDropdownOptions('suffix')}
          textProp="name"
          valueProp="value"
          label={props.labels.suffixLabel}
          disabled={isUpdatingUser}
          maxLength={80}
          isOptional
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
        <FormTextInput
          control={control}
          name="firstName"
          label={props.labels.firstNameLabel}
          isOptional
          disabled
        />

        <FormTextInput
          control={control}
          name="lastName"
          label={props.labels.lastNameLabel}
          isOptional
          disabled
        />
      </div>

      <RichTextUI value={props.labels.howToEditNameNotice} className="body-m !mt-5 !mb-2 w-full" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
        <FormTextInput
          control={control}
          name="nickname"
          label={props.labels.nicknameLabel}
          disabled={isUpdatingUser}
          maxLength={80}
          isOptional
        />

        <FormDropdown
          control={control}
          name="pronouns"
          options={getContactInformationFieldsDropdownOptions('pronouns')}
          textProp="name"
          valueProp="value"
          label={props.labels.pronounLabel}
          disabled={isUpdatingUser}
          maxLength={80}
          isOptional
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
        <FormTextInput
          control={control}
          name="phoneNumber"
          disabled={isUpdatingUser}
          label={props.labels.phoneLabel}
          maxLength={40}
          type="number"
        />
      </div>

      <ProfileSectionFooter {...props} isSubmitting={isUpdatingUser} />
    </form>
  );
};
