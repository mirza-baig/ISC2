import { FieldValues, useController, UseControllerProps } from 'react-hook-form';
import { ChangeEvent, KeyboardEventHandler, useCallback } from 'react';
import clsx from 'clsx';
 
import { QuestionIcon } from 'icons/index';
import { useFormFields } from 'providers/index';
 
import Tooltip from './Tooltip';
 
export namespace FormTextInput {
  export type Props<T extends FieldValues> = UseControllerProps<T> & {
    type?: HTMLInputElement['type'];
    label: string;
    isOptional?: boolean;
    tooltipText?: string;
    maxLength?: number;
    labelClassName?: string;
    requiredLabelClassName?: string;
    /**
     * Opt in to showing the tooltip on an optional field. The tooltip shares the row
     * with the "Required" text, so by default it is hidden along with it.
     */
    showTooltipWhenOptional?: boolean;
  };
}
 
const DIGITS = '0123456789';
 
const STYLES =
  'border disabled:!bg-input-disabled disabled:!opacity-100 disabled:!text-black border-black h-13 rounded-lg w-full text-gray-70 px-3 body-s outline-isc2-green focus:ring-isc2-green focus:border-isc2-green';
 
export function FormTextInput<T extends FieldValues>({
  type = 'text',
  name,
  label,
  control,
  isOptional,
  tooltipText,
  maxLength,
  disabled,
  labelClassName,
  requiredLabelClassName,
  showTooltipWhenOptional,
}: FormTextInput.Props<T>) {
  const { requiredText, getFieldErrorMessage } = useFormFields();
 
  const {
    field: { value, ...rest },
    fieldState: { error },
  } = useController({ control, name });
 
  const onInput: KeyboardEventHandler<HTMLInputElement> = useCallback(
    (evt) => {
      if (evt.code === 'Backspace') {
        return;
      }
 
      if (type === 'number') {
        const isDigit = DIGITS.includes(evt.key);
 
        if (!isDigit) {
          evt.preventDefault();
        }
      }
    },
    [type]
  );
 
  const onFormFieldChange = useCallback(
    (ev: ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
      if (disabled) {
        return;
      }
 
      rest.onChange(ev);
    },
    [rest, disabled]
  );
 
  const errorMessage = getFieldErrorMessage({ field: label, error });
  const showTooltip = Boolean(tooltipText) && (!isOptional || Boolean(showTooltipWhenOptional));
 
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1">
        <label
          className={clsx('text-black', labelClassName || 'body-s')}
          htmlFor={name}
          aria-label={label}
        >
          {label}
        </label>
        {(showTooltip || !isOptional) && (
          <span
            className={clsx(
              'flex items-center text-gray-70',
              requiredLabelClassName || 'body-s !text-xxs'
            )}
          >
            {showTooltip && (
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
        type="text"
        maxLength={maxLength}
        id={name}
        className={clsx(
          STYLES,
          errorMessage && '!border-red-warning !border-2 focus:!ring-transparent'
        )}
        onKeyDown={onInput}
        value={(value as HTMLInputElement['value']) ?? ''}
        disabled={disabled}
        onChange={onFormFieldChange}
      />
      <label className="text-red-warning body-s font-semibold mt-2">{errorMessage}</label>
    </div>
  );
}
 