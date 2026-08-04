import { Field } from '@sitecore-jss/sitecore-jss-nextjs';
import { ComponentProps } from 'lib/component-props';

import { RichTextUI } from 'ui/index';

export type AccordionRichTextItemProps = ComponentProps & {
  fields: Fields;
};

interface Fields {
  content: Field<string>;
}

const AccordionRichTextItem = (props: AccordionRichTextItemProps) => {
  if (!props.fields.content) {
    return null;
  }

  return <RichTextUI value={props.fields.content.value} className="overflow-hidden" />;
};

export default AccordionRichTextItem;
