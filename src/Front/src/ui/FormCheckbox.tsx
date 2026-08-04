/* eslint-disable @typescript-eslint/no-explicit-any */
import { FieldValues, useController, UseControllerProps } from 'react-hook-form';
import clsx from 'clsx';

import { useFormFields } from 'providers/index';

import RichTextUI from './RichTextUI';

export namespace FormCheckbox {
  export type Props<T extends FieldValues> = UseControllerProps<T> & {
    label: string;
    className?: boolean;
  };
}

export function FormCheckbox<T extends FieldValues>({
  name,
  label,
  control,
  className,
  disabled,
}: FormCheckbox.Props<T>) {
  const { getFieldErrorMessage } = useFormFields();

  const {
    field: { value, ...rest },
    fieldState: { error },
  } = useController({ control, name });

  const errorMessage = getFieldErrorMessage({ field: label, error });

  return (
    <div className="flex flex-col">
      <div className={clsx('space-x-2 flex items-center', className)}>
        <input
          {...rest}
          id={name}
          type="checkbox"
          disabled={disabled}
          checked={value as HTMLInputElement['checked']}
          value={value as HTMLInputElement['value']}
          aria-label={label}
          className={clsx(
            'h-4 w-4 cursor-pointer rounded-sm border-black-100 checked:border-isc2-green bg-white-00 hover:text-isc2-green checked:text-isc2-green focus:ring-isc2-green disabled:text-gray-50 disabled:border-gray-50 disabled:ring-gray-50 disabled:cursor-pointer',
            errorMessage && 'focus:ring-red-warning border-red-warning border-2'
          )}
        />

        <RichTextUI className={clsx('body-s', errorMessage && '!text-red-warning')} value={label} />
      </div>
    </div>
  );
}
