import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useCallback, useMemo } from 'react';

import { CloseIcon } from 'icons/index';
import { FormFieldsProvider, useModal, useLayout } from 'providers/index';
import { FormTextInput, FormCheckbox, Button } from 'ui/index';
import { useLoggedUser, useCreateAllocationMembers, useAddAllocations } from 'hooks/index';
import {
  AddUserInformation,
  AddUserInformationSchema,
  Allocation,
  AllocationDetailsLabels,
  AllocationDetailsMessages,
} from 'types/index';

type AllocationsAddUserModalProps = {
  labels: AllocationDetailsLabels;
  messages: AllocationDetailsMessages;
  allocation?: Allocation;
};

export default function AllocationsAddUserModal({
  allocation,
  labels,
  messages,
}: AllocationsAddUserModalProps) {
  const { closeModal } = useModal();
  const { externalID } = useLoggedUser();
  const { addFlashAlert } = useLayout();

  const {
    handleSubmit,
    control,
    getValues,
    setError,
    formState: { isValid },
  } = useForm<AddUserInformation>({
    mode: 'onSubmit',
    resolver: zodResolver(AddUserInformationSchema),
    defaultValues: {
      lastName: '',
      firstName: '',
      email: '',
      forAllocation: false,
    },
  });

  const onAllocationAddSuccess = useCallback(() => {
    addFlashAlert({
      type: 'success',
      label: messages?.singleUserSuccessfulyAllocatedMessage,
      closable: true,
    });

    closeModal();
  }, [addFlashAlert, closeModal, messages?.singleUserSuccessfulyAllocatedMessage]);

  const onAllocationAddError = useCallback(() => {
    addFlashAlert({
      type: 'error',
      label: messages?.failedToAllocateSingleUserMessage,
      closable: true,
    });

    closeModal();
  }, [addFlashAlert, closeModal, messages?.failedToAllocateSingleUserMessage]);

  const { addAllocation, isAddingAllocation } = useAddAllocations({
    onSuccess: onAllocationAddSuccess,
    onError: onAllocationAddError,
  });

  const onUserCreateSuccess = useCallback(() => {
    const formValues = getValues();

    if (formValues.forAllocation) {
      return addAllocation([formValues]);
    }

    addFlashAlert({
      type: 'success',
      label: messages?.singleUserSuccessfulyCreatedMessage,
      closable: true,
    });

    closeModal();
  }, [
    getValues,
    addAllocation,
    addFlashAlert,
    closeModal,
    messages?.singleUserSuccessfulyCreatedMessage,
  ]);

  const onUserCreateError = useCallback(() => {
    addFlashAlert({
      type: 'error',
      label: messages?.failedToCreateSingleUserMessage,
      closable: true,
    });
  }, [addFlashAlert, messages?.failedToCreateSingleUserMessage]);

  const { createAllocationMembers, isCreatingAllocationMember } = useCreateAllocationMembers({
    onSuccess: onUserCreateSuccess,
    onError: onUserCreateError,
  });

  const isPending = useMemo(() => {
    return isCreatingAllocationMember || isAddingAllocation;
  }, [isCreatingAllocationMember, isAddingAllocation]);

  const onFormSubmitted: SubmitHandler<AddUserInformation> = (data) => {
    if (!isValid || isPending || !externalID || !allocation) {
      return;
    }

    const emailAlreadyExists = allocation.users.find((user) => user.email === data.email);

    if (emailAlreadyExists) {
      return setError('email', { message: 'email_already_used' });
    }

    createAllocationMembers({
      orderNumber: allocation.orderNumber || '',
      productSku: allocation.sku || '',
      members: [
        {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          isAvailableToAllocate: true,
        },
      ],
    });
  };

  return (
    <FormFieldsProvider
      requiredText={labels?.addUsersModalRequiredLabel}
      requiredErrorMessage={messages?.addUsersModalRequiredErrorMessage}
      emailFormatErrorMessage={messages?.addUsersModalInvalidEmailErrorMessage}
      emailAlreadyExistingErrorMessage={messages?.singleUserAlreadyExistsMessage}
    >
      <div className="flex flex-col justify-self-center items-center w-[100vw] max-w-[45.125rem] px-5">
        <div className="flex w-full justify-end">
          <button
            aria-label="Close modal"
            className="py-1 px-2 rounded-full bg-white-00 text-black-100"
            onClick={closeModal}
          >
            <CloseIcon size={35} />
          </button>
        </div>
        <div className="bg-white-00 rounded-lg h-min mt-8 max-h-[80vh] w-full overflow-y-auto">
          <div className="p-8 body-m text-black-100 text-xsm leading-23">
            <h4 className="mb-8 text-black headline-s">{labels?.addUsersModalTitle}</h4>
            <form className="flex flex-col space-y-7.5" onSubmit={handleSubmit(onFormSubmitted)}>
              <FormTextInput
                name="firstName"
                control={control}
                label={labels?.addUsersModalFirstNameLabel}
                maxLength={80}
                disabled={isPending}
                labelClassName={'body-m'}
                requiredLabelClassName={'body-s'}
              />
              <FormTextInput
                name="lastName"
                control={control}
                label={labels?.addUsersModalLastNameLabel}
                maxLength={80}
                disabled={isPending}
              />
              <FormTextInput
                name="email"
                control={control}
                label={labels?.addUsersModalWorkEmailLabel}
                maxLength={255}
                disabled={isPending}
              />
              <FormCheckbox
                name="forAllocation"
                control={control}
                label={labels?.addUsersModalSelectForAllocationLabel}
                disabled={isPending}
              />
              <div className="flex justify-between items-center pt-8 border-t border-gray-50">
                <Button
                  type="button"
                  variant="secondary"
                  disabled={isPending}
                  onClick={closeModal}
                  label={labels?.addUsersModalCancelCtaLabel}
                />
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isPending}
                  label={labels?.addUsersModalAddCtaLabel}
                />
              </div>
            </form>
          </div>
        </div>
      </div>
    </FormFieldsProvider>
  );
}
