import { FieldValues, useController, UseControllerProps } from 'react-hook-form';
import { ChangeEvent, useCallback } from 'react';
import clsx from 'clsx';

import { QuestionIcon } from 'icons/index';
import { useFormFields } from 'providers/index';

import Tooltip from './Tooltip';

export namespace FormDropdown {
  export type Props<T extends FieldValues, Q> = UseControllerProps<T> & {
    label: string;
    tooltipText?: string;
    isOptional?: boolean;
    options?: Q[] | null;
    valueProp: keyof Q;
    textProp: keyof Q;
    maxLength?: number;
    onChange?: (value: string) => void;
  };
}

const STYLES =
  'border disabled:!bg-input-disabled disabled:!opacity-100 disabled:!text-black border-black h-13 rounded-lg w-full text-gray-70 px-3 body-s outline-isc2-green focus:ring-isc2-green focus:border-isc2-green';

export function FormDropdown<T extends FieldValues, Q>({
  name,
  valueProp,
  textProp,
  control,
  label,
  options,
  isOptional,
  tooltipText,
  maxLength,
  disabled,
  onChange,
}: FormDropdown.Props<T, Q>) {
  const { requiredText, getFieldErrorMessage, dropdownPlaceholder } = useFormFields();

  const {
    field: { value, ...rest },
    fieldState: { error },
  } = useController({ control, name });

  const errorMessage = getFieldErrorMessage({ field: label, error });

  const onFormFieldChange = useCallback(
    (ev: ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
      if (disabled) {
        return;
      }

      if (onChange) {
        onChange(ev.target.value);
      }

      rest.onChange(ev);
    },
    [rest, disabled, onChange]
  );

  const hasOptions = options && options.length > 0;

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1">
        <label className="body-s text-black" htmlFor={name} aria-label={label}>
          {label}
        </label>
        {!isOptional && (
          <span className="body-s flex items-center !text-xxs text-gray-70">
            {Boolean(tooltipText) && (
              <Tooltip
                Component={<QuestionIcon size={18} className="text-isc2-green" />}
                content={tooltipText!}
                position="left"
                className="w-52 text-center"
              />
            )}

            {requiredText}
          </span>
        )}
      </div>

      {hasOptions && (
        <select
          {...rest}
          defaultValue=""
          value={value as HTMLInputElement['value']}
          title={label}
          disabled={disabled}
          className={clsx(
            STYLES,
            error?.message && '!border-red-warning !border-2 focus:!ring-transparent'
          )}
          onChange={onFormFieldChange}
        >
          <option hidden value="">
            {dropdownPlaceholder}
          </option>
          {options.map((option) => (
            <option key={option[valueProp] as string} value={option[valueProp] as string}>
              {option[textProp] as string}
            </option>
          ))}
        </select>
      )}

      {!hasOptions && (
        <input
          {...rest}
          value={value as HTMLInputElement['value']}
          id={name}
          disabled={disabled}
          className={clsx(
            STYLES,
            errorMessage && '!border-red-warning !border-2 focus:!ring-transparent'
          )}
          onChange={onFormFieldChange}
          maxLength={maxLength}
        />
      )}

      <label className="text-red-warning body-s font-semibold mt-2">{errorMessage}</label>
    </div>
  );
}
