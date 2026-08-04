import { ComponentProps } from 'lib/component-props';
import { Field, LinkField } from '@sitecore-jss/sitecore-jss-nextjs';
import { useMemo } from 'react';
import clsx from 'clsx';

import AccordionSection, { AccordionSectionProps } from './AccordionSection';
import { DropLinkFieldType } from 'src/types/index';
import SectionTitle from 'ui/SectionTitle';
import { formatBackgroundColorCssClassName } from 'utils/background-color';
import { getContrastTextColor } from 'utils/index';

export type AccordionProps = ComponentProps & {
  fields: Fields;
};

interface Fields {
  backgroundGradient: DropLinkFieldType;
  title?: Field<string>;
  description?: Field<string>;
  cta?: LinkField;
  accordionSections: AccordionSectionProps[];
}

const colorMap = {
  'white-00': 'bg-black-05',
  'gray-10': 'bg-black-05',
  'dark-green': 'bg-darker-green',
  'dark-blue': 'bg-darker-blue',
};

const Accordion = (props: AccordionProps): JSX.Element => {
  const isRichText = useMemo(
    () => props.fields.accordionSections.some((obj) => obj.fields.hasOwnProperty('richTextItems')),
    [props.fields.accordionSections]
  );

  const backgroundGradient = useMemo(() => props.fields.backgroundGradient, [props.fields]);

  const openBackgroundColorClass = useMemo(() => {
    if (!isRichText) {
      return;
    }

    const background =
      (backgroundGradient?.fields?.Value?.value as keyof typeof colorMap) || 'white-00';

    return colorMap[background];
  }, [backgroundGradient, isRichText]);

  const sectionClass = useMemo(() => {
    if (isRichText) {
      const bgClass = formatBackgroundColorCssClassName(backgroundGradient, 'bg-white-00');
      const textClass = getContrastTextColor(backgroundGradient);

      return clsx('px-5 md:px-44 pb-14 md:pb-20', bgClass, textClass);
    }

    return '';
  }, [isRichText, backgroundGradient]);

  return (
    <section className={clsx('accordion-component', sectionClass)}>
      {isRichText && (
        <SectionTitle
          title={props.fields.title}
          subtitle={props.fields.description}
          link={props.fields.cta}
        />
      )}
      {props.fields.accordionSections?.map((section) => (
        <AccordionSection
          {...section}
          key={section.id}
          isRichText={isRichText}
          openBackgroundColorClass={openBackgroundColorClass}
        />
      ))}
    </section>
  );
};

export default Accordion;
