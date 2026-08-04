import {
  ComponentRendering,
  Field,
  LinkField,
  RouteData,
  Placeholder,
  withDatasourceCheck,
} from '@sitecore-jss/sitecore-jss-nextjs';
import { useMemo } from 'react';
import { useLayout } from 'src/providers/layout';
import { ComponentProps } from 'lib/component-props';
import SectionTitle from 'ui/SectionTitle';
import HorizontalTabs, { HorizontalTabContent } from './HorizontalTabs';

type HorizontalTabsContainerProps = ComponentProps & {
  rendering: ComponentRendering | RouteData;
  fields: {
    heading: Field<string>;
    description: Field<string>;
    linkCta: LinkField;
  };
};

function HorizontalTabsContainer({ rendering, fields }: HorizontalTabsContainerProps): JSX.Element {
  const { isEditing } = useLayout();

  const tabsWithContent = useMemo(() => {
    if (rendering?.placeholders) {
      const tabs = rendering?.placeholders['horizontal-tabs'] as unknown as HorizontalTabContent[];

      if (isEditing) {
        return tabs;
      }

      return tabs?.filter(({ fields }) => fields?.tabName || Boolean(fields?.tabName));
    }

    return [];
  }, [rendering?.placeholders, isEditing]);

  return (
    <section className="horizontal-tabs pb-14 sm:pb-20 px-5 sm:px-16">
      <SectionTitle title={fields?.heading} subtitle={fields?.description} link={fields?.linkCta} />
      {!isEditing && <HorizontalTabs tabs={tabsWithContent} />}
      <Placeholder name="horizontal-tabs" rendering={rendering} />
    </section>
  );
}

export default withDatasourceCheck()<HorizontalTabsContainerProps>(HorizontalTabsContainer);
