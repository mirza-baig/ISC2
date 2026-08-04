import clsx from 'clsx';
import { useProductForm } from 'providers/productForm';
import { useEffect, useState } from 'react';
import { FormOption } from 'types/forms';

interface ProductFormDescriptionFields {
  fields: {
    label: string;
    name: string;
    values?: FormOption[];
    additionalClasses?: string;
  };
}

interface ProductFormDescriptionData {
  title?: string;
  description?: string;
}

const ProductFormDescription = ({ fields }: ProductFormDescriptionFields) => {
  const { productVariants } = useProductForm();
  const [data, setData] = useState<ProductFormDescriptionData>({
    title: '',
    description: '',
  });
  useEffect(() => {
    const isSingleVariant = productVariants?.length === 1;
    setData({
      title: isSingleVariant ? productVariants[0].title : undefined,
      description: isSingleVariant ? productVariants[0].description : undefined,
    });
  }, [productVariants]);

  return (
    <div className={clsx('w-full', fields?.additionalClasses)}>
      <div className="space-y-2">
        {data?.title && <h3 className="body-l text-black-100 my-0">{data?.title}</h3>}
        {data?.description && (
          <p className="body-s text-black-100 mt-0 mb-0">{data?.description}</p>
        )}
      </div>
    </div>
  );
};

export default ProductFormDescription;
