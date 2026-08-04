import clsx from 'clsx';
import { useCheckoutProcess } from 'providers/index';
import { ReactNode } from 'react';

export namespace PaymentMethodSection {
  export type Props = {
    isActive: boolean;
    title: string;
    children?: ReactNode;
  };
}

export function PaymentMethodSection({ title, isActive, children }: PaymentMethodSection.Props) {
  const { hasPaymentError } = useCheckoutProcess();

  return (
    <section
      className={clsx(
        'border ring-1 ring-transparent p-5 space-y-5 border-black rounded-md',
        hasPaymentError && '!ring-red-warning border-red-warning',
        !hasPaymentError && isActive && '!ring-isc2-green border-isc2-green'
      )}
    >
      <span className="flex items-center body-m">{title}</span>

      {children}
    </section>
  );
}
