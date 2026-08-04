import { ComponentProps, ReactNode } from 'react';
import clsx from 'clsx';

import LoadingIndicator from './LoadingIndicator';

export namespace Button {
  export type Props = Omit<ComponentProps<'button'>, 'children'> & {
    label: string;
    variant: 'primary' | 'secondary' | 'tertiary';
    isLoading?: boolean;
    Icon?: ReactNode;
  };
}

const VARIANT_CLASS: Record<Button.Props['variant'], string> = {
  primary: 'primary-cta',
  secondary: 'secondary-cta',
  tertiary: 'tertiary-cta',
};

export const Button = ({
  label,
  isLoading,
  variant,
  className,
  Icon,
  ...otherProps
}: Button.Props) => {
  return (
    <button
      {...otherProps}
      disabled={otherProps.disabled || isLoading}
      className={clsx(
        'cta relative flex space-x-2 self-end !text-xs !tracking-normal',
        VARIANT_CLASS[variant],
        className
      )}
      aria-label={label}
    >
      {isLoading && (
        <LoadingIndicator className="absolute inset-0 !p-0 h-full justify-self-center" />
      )}
      {Icon}
      <span className={clsx(isLoading && 'opacity-0')}>{label}</span>
    </button>
  );
};
