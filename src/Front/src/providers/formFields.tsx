/* eslint-disable @typescript-eslint/no-empty-function */
import { createContext, useContext, useCallback } from 'react';
import { FieldError } from 'react-hook-form';

type FormFieldError = {
  field: string;
  error?: FieldError;
};

type FormFieldsContextProps = {
  requiredText: string;
  dropdownPlaceholder?: string;
  getFieldErrorMessage: (fieldError: FormFieldError) => string;
};

const FormFieldsContext = createContext<FormFieldsContextProps>({
  requiredText: '',
  dropdownPlaceholder: '',
  getFieldErrorMessage: () => '',
});

type FormFieldsProviderProps = {
  requiredText: string;
  requiredErrorMessage?: string;
  incorrectPostalCodeMessage?: string;
  emailFormatErrorMessage?: string;
  emailAlreadyExistingErrorMessage?: string;
  stateRequiredErrorMessage?: string;
  dropdownPlaceholder?: string;
  children: React.ReactNode;
};

const FormFieldsProvider: React.FC<FormFieldsProviderProps> = ({
  requiredText,
  requiredErrorMessage = '',
  incorrectPostalCodeMessage = '',
  emailFormatErrorMessage = '',
  emailAlreadyExistingErrorMessage = '',
  stateRequiredErrorMessage = '',
  dropdownPlaceholder = '',
  children,
}) => {
  const getFieldErrorMessage = useCallback(
    ({ field, error }: FormFieldError) => {
      if (error?.type === 'too_small') {
        return requiredErrorMessage.replaceAll('{field}', field);
      }

      if (error?.message === 'incorrect_postal_code') {
        return incorrectPostalCodeMessage;
      }

      if (error?.message === 'state_required') {
        return stateRequiredErrorMessage || requiredErrorMessage.replaceAll('{field}', field);
      }

      if (error?.message === 'email') {
        return emailFormatErrorMessage.replaceAll('{field}', field);
      }

      if (error?.message === 'email_already_used') {
        return emailAlreadyExistingErrorMessage.replaceAll('{field}', field);
      }

      // Return a string with a space so the error is visible in the checkbox
      // without seeing an unnecessary error message
      if (error?.message === 'checkbox_required') {
        return ' ';
      }

      return '';
    },
    [
      requiredErrorMessage,
      incorrectPostalCodeMessage,
      emailFormatErrorMessage,
      emailAlreadyExistingErrorMessage,
      stateRequiredErrorMessage,
    ]
  );

  return (
    <FormFieldsContext.Provider
      value={{
        requiredText,
        getFieldErrorMessage,
        dropdownPlaceholder,
      }}
    >
      {children}
    </FormFieldsContext.Provider>
  );
};

const useFormFields = () => useContext(FormFieldsContext);

export { FormFieldsProvider, useFormFields };
