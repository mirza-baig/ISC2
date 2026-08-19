import type { ReactNode } from 'react';

import B2BCartSurface from './B2BCartSurface';

export interface B2BCartPageBodyProps {
  title?: string | number;
  isPreloading?: boolean;
  notice?: ReactNode;
  children?: ReactNode;
  summaryCoupon?: ReactNode;
  summaryFooter?: ReactNode;
}

const PANEL_CLASSNAME =
  'flex w-full min-w-0 flex-col rounded-lg border border-gray-50 bg-white-00 max-sm:rounded-none max-sm:border-x-0 lg:flex-1';

const B2BCartPageBody = ({
  title,
  isPreloading = false,
  notice,
  children,
  summaryCoupon,
  summaryFooter,
}: B2BCartPageBodyProps): JSX.Element => (
  <main className="max-width-container pt-10 md:pt-15">
    {title && <h1 className="headline-l md:headline-xl">{title}</h1>}

    <div className="mt-8 flex flex-col gap-y-5 md:mt-15">
      {notice}
      <B2BCartSurface
        className={PANEL_CLASSNAME}
        isPreloading={isPreloading}
        summaryPlacement="aside"
        summaryCoupon={summaryCoupon}
        summaryFooter={summaryFooter}
      />
      {children}
    </div>
  </main>
);

export default B2BCartPageBody;
