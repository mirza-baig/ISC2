import clsx from 'clsx';
import { Text, TextField } from '@sitecore-jss/sitecore-jss-nextjs';

type PromoPill = {
  className?: string;
  field: TextField;
};

const PromoPill = ({ field, className }: PromoPill) => {
  if (!field.value?.toString().trim()) {
    return null;
  }

  return (
    <div className="flex items-center">
      <Text
        tag="div"
        field={field}
        className={clsx('py-1 px-4 rounded-tag text-center body-s truncate', className)}
      />
    </div>
  );
};

export default PromoPill;
