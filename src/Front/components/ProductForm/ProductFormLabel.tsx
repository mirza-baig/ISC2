import Tooltip from 'ui/Tooltip';
import QuestionIcon from 'icons/QuestionIcon';
import { FormElementTypes } from 'types/forms';
import clsx from 'clsx';

interface ProductFormSelectFields {
  fields: {
    label: string;
    isRequired?: boolean;
    tooltip?: string;
    type?: string;
    isRequiredLabelHidden?: boolean;
    isError?: boolean;
  };
}

const ProductFormLabel = ({ fields }: ProductFormSelectFields) => {
  const {
    label,
    isRequired,
    tooltip,
    type,
    isRequiredLabelHidden,
    isError = false,
  } = { ...fields };
  return (
    <div className="flex items-center justify-between mb-1 min-h-6">
      <div>
        {type === FormElementTypes.radio ? (
          <legend className="body-m">{label}</legend>
        ) : (
          <label htmlFor={`${label}-${type}`} className="body-m">
            {label}
          </label>
        )}
      </div>
      {!isRequiredLabelHidden && (
        <div className="flex items-center space-x-1 body-s text-gray-500">
          {isRequired && <span>Required</span>}
          {tooltip && (
            <Tooltip
              Component={
                <QuestionIcon
                  size={25}
                  className={clsx(isError ? 'text-red-error' : 'text-isc2-green')}
                />
              }
              content={tooltip}
              position="left"
              className="w-52 text-center"
            />
          )}
        </div>
      )}
    </div>
  );
};

export default ProductFormLabel;
