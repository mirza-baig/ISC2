import { NextImage } from '@sitecore-jss/sitecore-jss-nextjs';

import { useCartFields } from 'providers/index';

export default function EmptyCart() {
  const { fields, labels } = useCartFields();

  return (
    <main className="bg-gray-10 px-5 py-10 md:px-16 md:pt-16 md:pb-27">
      <NextImage width={40} height={40} field={fields.shoppingCartIcon} />
      <h1 className="headline-l md:headline-xl mt-2 mb-8">{fields.title.value}</h1>
      <div className="space-y-2">
        <h4 className="body-l">{labels.emptyStateNotice}</h4>
        <h3 className="headline-s">{fields.emptyCartSubtitle.value}</h3>
      </div>
    </main>
  );
}
