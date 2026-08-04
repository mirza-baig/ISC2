import { NextImage } from '@sitecore-jss/sitecore-jss-nextjs';

import { useCartFields } from 'providers/index';
import { RichTextUI } from 'ui/index';

const CartError = () => {
  const { fields, errorLabels } = useCartFields();

  return (
    <>
      <div className="bg-gray-10 px-5 py-10 md:px-16 md:pt-16 md:pb-27">
        <NextImage width={47} height={42} field={fields.alertIcon} />
        <h1 className="headline-l md:headline-xl mt-2 mb-8">{errorLabels.title}</h1>
        <h2 className="body-m">{errorLabels.subTitle}</h2>
      </div>
      <div className="px-5 md:px-72 py-10 md:pt-28">
        <h3 className="eyebrow p-2 border-b text-gray-70 border-gray-30 uppercase">
          {errorLabels.tryAgainListTitle}
        </h3>
        <ul className="flex flex-col gap-3 mt-3 list-circle list-inside">
          <RichTextUI value={fields.tryAgainList.value} className="body-m cart-error-list" />
        </ul>
      </div>
    </>
  );
};

export default CartError;
