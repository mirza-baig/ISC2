import { ImageField, TextField, Image } from '@sitecore-jss/sitecore-jss-nextjs';
import RichTextUI from 'ui/RichTextUI';

interface CartFooterProps {
  fields: {
    logoImage: ImageField;
    legalCopy: TextField;
  };
}

const CartFooter = ({ fields }: CartFooterProps) => {
  return (
    <section className="bg-gray-90 text-white-00 space-y-6 md:space-y-16 px-5 md:px-16 py-20">
      <div>
        <Image field={fields.logoImage} className="max-w-20" />
      </div>
      <div className="flex flex-col md:flex-row md:items-center">
        <div className="rich-text-wrap">
          <RichTextUI
            className="body-s max-w-2xl flex-1"
            value={fields.legalCopy?.value?.toString()}
          />
        </div>
      </div>
    </section>
  );
};

export default CartFooter;
