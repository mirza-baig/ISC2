import React from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import type { Caption } from 'types/index';

const Caption: React.FC<Caption> = ({ title, content }) => {
  return (
    <div className="flex flex-col">
      <Text tag="div" className="body-l" field={title} />
      <Text tag="div" className="body-s mt-2" field={content} />
    </div>
  );
};

export default Caption;
