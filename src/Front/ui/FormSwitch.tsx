import clsx from 'clsx';
import { useCallback } from 'react';
import { FieldValues, useController, UseControllerProps } from 'react-hook-form';

export namespace FormSwitch {
  export type Props<T extends FieldValues> = UseControllerProps<T> & {
    label: string;
  };
}

export function FormSwitch<T extends FieldValues>({
  name,
  label,
  control,
  disabled,
}: FormSwitch.Props<T>) {
  const { field } = useController({ control, name });

  const onSwitchValueChange = useCallback(() => {
    if (!disabled) {
      field.onChange(!field.value);
    }
  }, [field, disabled]);

  return (
    <>
      <label className="body-m text-gray-70" htmlFor={name} aria-label={label}>
        {label}
      </label>
      <button
        type="button"
        disabled={disabled}
        onClick={onSwitchValueChange}
        className={clsx(
          'w-12 h-6 rounded-2xl bg-gray-50 relative transition-all duration-300',
          field.value && 'bg-isc2-green',
          disabled && 'opacity-35'
        )}
        aria-label={`Switch ${label}`}
      >
        <span
          className={clsx(
            'aspect-square bg-white absolute rounded-full h-5.5 -translate-y-1/2 transition-all duration-300',
            field.value ? 'left-[calc(100%-1.375rem)]' : 'left-0.5'
          )}
        />
      </button>
    </>
  );
}
