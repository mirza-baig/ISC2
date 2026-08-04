import { useModal } from 'providers/index';
import {
  Link,
  LinkField,
  RichText,
  RichTextField,
  Text,
  TextField,
} from '@sitecore-jss/sitecore-jss-nextjs';
import { useCallback } from 'react';

export interface ProductFormModalType {
  heading?: TextField;
  description?: RichTextField;
  primaryCTA?: LinkField;
  secondaryCTA?: LinkField;
  formThirdPartyCTA?: string;
}

type ProductFormModalProps = { fields: ProductFormModalType };

const ProductFormModal = ({ fields }: ProductFormModalProps) => {
  const { closeModal } = useModal();

  const onPrimaryCtaClose = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      if (fields?.primaryCTA?.value?.href === '#' || fields?.primaryCTA?.value?.href === '') {
        e.preventDefault();
        closeModal();
      }
    },
    [closeModal, fields?.primaryCTA?.value?.href]
  );

  return (
    <div className="m-auto max-h-full flex justify-center items-center">
      <div className="bg-white-00 rounded-lg py-2">
        <div className="px-12 py-12 text-black-100 text-xsm leading-23 max-w-[90vw] max-h-[90vh] overflow-auto">
          {fields?.heading?.value && (
            <Text tag="h4" className="headline-s font-normal" field={fields.heading} />
          )}
          {fields?.description?.value && (
            <RichText
              tag="div"
              field={fields.description}
              className="mt-4 body-m popup-rich-text"
            />
          )}
          <div className="flex mt-8 space-x-8 items-center">
            {fields?.primaryCTA?.value?.href !== undefined && (
              <Link
                type="button"
                field={{
                  href: fields?.primaryCTA?.value?.href,
                  text: fields?.primaryCTA?.value?.text,
                  target: '_blank',
                  linktype: 'button',
                }}
                onClick={onPrimaryCtaClose}
                className="primary-cta text-xsm leading-20 tracking-link px-8"
              />
            )}

            {fields?.secondaryCTA?.value?.text && (
              <button
                type="button"
                className="tertiary-cta text-xsm leading-20 tracking-link"
                onClick={closeModal}
                aria-label="Close modal"
              >
                {fields?.secondaryCTA?.value?.text}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductFormModal;
