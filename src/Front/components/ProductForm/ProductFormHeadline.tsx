interface ProductFormHeadlineFields {
  fields: {
    label: string;
    name: string;
  };
}

const ProductFormHeadline = ({ fields }: ProductFormHeadlineFields) => {
  return (
    <div className="w-full">
      <h2 className="headline-s">{fields.label}</h2>
    </div>
  );
};

export default ProductFormHeadline;
