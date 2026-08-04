import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useCallback } from 'react';

import {
  EmploymentInformation,
  EmploymentInformationSchema,
  ProfileFormSections,
} from 'types/index';
import { useLoggedUser, useUpdateUserData } from 'hooks/index';
import { getEmploymentInformationFromUser } from 'utils/index';
import { FormTextInput, FormSwitch } from 'ui/index';

import { ProfileSectionFooter } from '../../Base/ProfileSectionFooter';
import { ProfileSectionProps, EmploymentInformationLabels } from '../../profile.types';

export namespace EmploymentInformationForm {
  export type Props = ProfileSectionProps & {
    labels: EmploymentInformationLabels;
    onSuccessfulEdit: () => void;
    onErrorEdit: () => void;
  };
}

export const EmploymentInformationForm = (props: EmploymentInformationForm.Props) => {
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
    mode: 'onChange',
    defaultValues: getEmploymentInformationFromUser(user),
    resolver: zodResolver(EmploymentInformationSchema),
  });

  const onFormSubmit = useCallback(
    (data: EmploymentInformation) => {
      if (isUpdatingUser || !isValid) {
        return;
      }

      updateUser(data);
    },
    [updateUser, isUpdatingUser, isValid]
  );

  return (
    <form className="flex flex-col space-y-5 !mt-8" onSubmit={handleSubmit(onFormSubmit)}>
      <FormTextInput
        control={control}
        name="employer"
        label={props.labels.employerNameLabel}
        tooltipText={props.labels.employerNameTooltip}
        disabled={isUpdatingUser}
        maxLength={75}
        isOptional
      />
      <FormTextInput
        control={control}
        name="jobTitle"
        label={props.labels.jobTitleLabel}
        disabled={isUpdatingUser}
        maxLength={255}
        isOptional
      />
      <FormTextInput
        control={control}
        name="workEmail"
        label={props.labels.workEmailLabel}
        tooltipText={props.labels.workEmailTooltip}
        maxLength={255}
        disabled={isUpdatingUser}
      />
      <FormTextInput
        type="number"
        control={control}
        name="workPhone"
        label={props.labels.workPhoneLabel}
        disabled={isUpdatingUser}
        maxLength={40}
        isOptional
      />
      <div className="grid grid-cols-[1fr_fit-content(3rem)] sm:grid-cols-[fit-content(40%)_1fr] gap-x-4 gap-y-2">
        <FormSwitch
          control={control}
          name="isGovernmentContractor"
          label={props.labels.governmentContractorSwitchLabel}
          disabled={isUpdatingUser}
        />
        <FormSwitch
          control={control}
          name="isGovernmentEmployee"
          label={props.labels.governmentEmployerSwitchLabel}
          disabled={isUpdatingUser}
        />
      </div>
      <ProfileSectionFooter {...props} isSubmitting={isUpdatingUser} />
    </form>
  );
};
