/// This rendering is only used for Experience editor view of horizontal tabs.

import { RichText as JSSRichText, RichTextField } from '@sitecore-jss/sitecore-jss-nextjs';
import clsx from 'clsx';
import { useLayout } from 'src/providers/layout';

import { DropLinkFieldType } from 'types/index';
import { formatBackgroundColorCssClassName } from 'utils/background-color';

export type TabContentRichTextProps = {
  className?: string;
  params?: { [key: string]: string };
  fields: {
    backgroundGradient?: DropLinkFieldType;
    mainContent: RichTextField;
  };
};

const TabContentRichText = ({ fields, params, className }: TabContentRichTextProps) => {
  const { isEditing } = useLayout();
  if (!fields) {
    return null;
  }

  if (isEditing) {
    return (
      <div
        className={clsx(
          'component rich-text',
          className,
          fields?.backgroundGradient &&
            formatBackgroundColorCssClassName(fields?.backgroundGradient)
        )}
        id={params?.RenderingIdentifier}
      >
        <JSSRichText field={fields?.mainContent} />
      </div>
    );
  }

  return <></>;
};

export default TabContentRichText;
