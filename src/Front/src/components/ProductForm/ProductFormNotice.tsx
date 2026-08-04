import { RichText } from '@sitecore-jss/sitecore-jss-nextjs';

interface ProductFormNoticeFields {
  fields: {
    label: string;
  };
}

const ProductFormNotice = ({ fields }: ProductFormNoticeFields) => {
  return (
    <div className="w-full pdp-notice">
      {fields?.label && (
        <RichText
          field={{ value: fields.label }}
          tag="p"
          className="bg-gray-10 tracking-tight text-black-100 py-4 px-5 rounded-lg body-s"
        />
      )}
    </div>
  );
};

export default ProductFormNotice;
