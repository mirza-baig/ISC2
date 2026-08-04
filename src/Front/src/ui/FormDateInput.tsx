import { FieldValues, useController, UseControllerProps } from 'react-hook-form';
import { ChangeEvent, useCallback } from 'react';
import clsx from 'clsx';
 
import { QuestionIcon } from 'icons/index';
import { useFormFields } from 'providers/index';
 
import Tooltip from './Tooltip';
 
export namespace FormDateInput {
  export type Props<T extends FieldValues> = UseControllerProps<T> & {
    label: string;
    isOptional?: boolean;
    tooltipText?: string;
    min?: string;
    max?: string;
  };
}
 
const STYLES =
  'border disabled:!bg-input-disabled disabled:!opacity-100 disabled:!text-black border-black h-13 rounded-lg w-full text-gray-70 px-3 body-s outline-isc2-green focus:ring-isc2-green focus:border-isc2-green';
 
/** Native date picker. The value is the `YYYY-MM-DD` string the input reports. */
export function FormDateInput<T extends FieldValues>({
  name,
  label,
  control,
  isOptional,
  tooltipText,
  disabled,
  min,
  max,
}: FormDateInput.Props<T>) {
  const { requiredText, getFieldErrorMessage } = useFormFields();
 
  const {
    field: { value, ...rest },
    fieldState: { error },
  } = useController({ control, name });
 
  const onFormFieldChange = useCallback(
    (ev: ChangeEvent<HTMLInputElement>) => {
      if (disabled) {
        return;
      }
 
      rest.onChange(ev);
    },
    [rest, disabled]
  );
 
  const errorMessage = getFieldErrorMessage({ field: label, error });
  const hasTooltip = Boolean(tooltipText);
 
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1">
        <label className="text-black body-s" htmlFor={name} aria-label={label}>
          {label}
        </label>
        {(hasTooltip || !isOptional) && (
          <span className="flex items-center text-gray-70 body-s !text-xxs">
            {hasTooltip && (
              <Tooltip
                Component={<QuestionIcon size={18} className="text-isc2-green" />}
                content={tooltipText!}
                position="left"
                className="w-52 text-center"
              />
            )}
 
            {!isOptional && requiredText}
          </span>
        )}
      </div>
      <input
        {...rest}
        type="date"
        id={name}
        min={min}
        max={max}
        className={clsx(
          STYLES,
          errorMessage && '!border-red-warning !border-2 focus:!ring-transparent'
        )}
        value={(value as HTMLInputElement['value']) ?? ''}
        disabled={disabled}
        onChange={onFormFieldChange}
      />
      <label className="text-red-warning body-s font-semibold mt-2">{errorMessage}</label>
    </div>
  );
}