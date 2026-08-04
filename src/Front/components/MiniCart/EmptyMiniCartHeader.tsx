import { Text } from '@sitecore-jss/sitecore-jss-nextjs';

import { useMiniCartFields } from 'providers/index';

export default function EmptyMiniCartHeader() {
  const { fields } = useMiniCartFields();

  return (
    <header className="flex flex-col w-full pl-4 pr-3 sm:px-4 pb-15 pt-22 sm:pt-28 bg-gray-10">
      <Text tag="h6" field={fields.heading} className="max-sm:pr-8 max-sm:w-full body-l mb-2" />
      <Text
        tag="h5"
        field={fields.description}
        className="max-sm:pr-8 max-sm:w-full headline-s w-1/2"
      />
    </header>
  );
}
