import { Field } from '@sitecore-jss/sitecore-jss-nextjs';

import { HorizontalTabsUI, RichTextUI } from 'ui/index';

export interface HorizontalTabContent {
  uid: string;
  fields: {
    tabName: Field<string>;
  };
  placeholders: {
    [key: string]: Array<{
      fields: {
        mainContent: Field<string>;
      };
    }>;
  };
}

interface HorizontalTabsProps {
  tabs: HorizontalTabContent[];
  className?: string;
}

const HorizontalTabs = ({ tabs, className }: HorizontalTabsProps): JSX.Element => (
  <HorizontalTabsUI
    tabs={tabs}
    getTabName={(tab) => tab?.fields?.tabName?.value}
    getTabKey={(tab) => tab?.uid}
    className={className}
    renderContent={(tab) => (
      <RichTextUI
        className="p-6"
        value={tab?.placeholders['tab-content'][0]?.fields.mainContent?.value}
        id={tab?.uid}
      />
    )}
  />
);

export default HorizontalTabs;
