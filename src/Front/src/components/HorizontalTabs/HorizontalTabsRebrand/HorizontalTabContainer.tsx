import { useCallback } from 'react';
import { Field, LinkField, withDatasourceCheck } from '@sitecore-jss/sitecore-jss-nextjs';
import { ComponentProps } from 'lib/component-props';

import { SectionTitle, HorizontalTabsUI } from 'ui/index';
import RichText, { RichTextProps } from 'components/RichText';
import SliderWithoutDescription from 'components/Slider/SliderWithoutDescription';
import { CardProps } from 'ui/Card';

interface SliderTabProps {
  children: CardProps[];
}

interface HorizontalTabContent {
  id: string;
  children: (RichTextProps | SliderTabProps)[];
  fields: {
    isItSliderTab: Field<boolean>;
    tabName: Field<string>;
  };
}

type HorizontalTabsContainerProps = ComponentProps & {
  fields: {
    props: {
      heading: Field<string>;
      description: Field<string>;
      linkCta: LinkField;
    };
    children: HorizontalTabContent[];
  };
};

function HorizontalTabContainer({ fields }: HorizontalTabsContainerProps) {
  const renderContent = useCallback((tab: HorizontalTabContent) => {
    const tabComponentProps = tab.children[0];

    if (tab.fields.isItSliderTab.value) {
      return (
        <SliderWithoutDescription
          key={tab.id}
          fields={{ ...(tabComponentProps as SliderTabProps) }}
        />
      );
    }

    return (
      <RichText key={tab.id} className="!px-0 !py-8" {...(tabComponentProps as RichTextProps)} />
    );
  }, []);

  if (!fields) {
    return null;
  }

  return (
    <section className="pb-14 sm:pb-20 px-5 sm:px-16">
      <SectionTitle
        title={fields.props.heading}
        subtitle={fields.props.description}
        link={fields.props.linkCta}
      />
      <HorizontalTabsUI
        tabs={fields.children}
        getTabName={(tab) => tab.fields.tabName.value}
        getTabKey={(tab) => tab.id}
        renderContent={renderContent}
      />
    </section>
  );
}

export default withDatasourceCheck()<HorizontalTabsContainerProps>(HorizontalTabContainer);
