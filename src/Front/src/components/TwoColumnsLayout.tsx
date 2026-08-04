import React from 'react';
import {
  ComponentParams,
  ComponentRendering,
  Placeholder,
} from '@sitecore-jss/sitecore-jss-nextjs';

interface ComponentProps {
  rendering: ComponentRendering & { params: ComponentParams };
  params: ComponentParams;
}

export const TwoColumnsLayout = (props: ComponentProps): JSX.Element => {
  return (
    <div className="flex flex-col sm:flex-row space-y-5 sm:space-y-0 sm:space-x-8">
      <div className="flex-1">
        <Placeholder name="two-columns-layout-left" rendering={props.rendering} />
      </div>
      <div className="flex-1">
        <Placeholder name="two-columns-layout-right" rendering={props.rendering} />
      </div>
    </div>
  );
};

export default TwoColumnsLayout;
