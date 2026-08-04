import { FieldValues, useController, UseControllerProps } from 'react-hook-form';
import clsx from 'clsx';

export namespace SwitchCheckbox {
  export type Props<T extends FieldValues> = UseControllerProps<T> & {
    label?: string;
    className?: string;
  };
}

export function SwitchCheckbox<T extends FieldValues>({
  name,
  label,
  control,
  className,
  disabled,
}: SwitchCheckbox.Props<T>) {
  const {
    field: { value, ...rest },
  } = useController({ control, name });

  return (
    <label className={clsx('form-switch', className)}>
      <input {...rest} type="checkbox" checked={value} disabled={disabled} aria-label={label} />
      <span className="form-slider round"></span>
      <div className="text-xs mt-4">
        <span className="text-gray-500">NO</span>
        <span className="mx-1">&nbsp;</span>
        <span className="text-isc2-green">YES</span>
      </div>
    </label>
  );
}
