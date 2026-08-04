import { Field, LinkField, RichTextField } from '@sitecore-jss/sitecore-jss-nextjs';
import clsx from 'clsx';

import { usePersonalizeComponent, useBackgroundGradient, useTextColor } from 'hooks/index';
import { RichTextUI, SectionTitle } from 'ui/index';
import { BackgroundGradient } from 'types/index';

export type RichTextProps = {
  className?: string;
  params?: { [key: string]: string };
  fields: {
    PersonalizeID: {
      value: string;
    };
    sectionTitle?: Field<string>;
    sectionDescription?: Field<string>;
    sectionLink?: LinkField;
    backgroundGradient?: BackgroundGradient;
    mainContent: RichTextField;
    tableContent: RichTextField;
  };
};

const LoadingSkeleton = () => (
  <div className="flex w-full flex-col space-y-5 animate-pulse">
    <div className="h-3 w-3/12 bg-gray-300" />
    <div className="h-6 w-full bg-gray-300" />
    <div className="h-6 w-11/12 bg-gray-300" />
    <div className="h-4 w-5/12 bg-gray-300" />
    <div className="h-4 ml-10 w-8/12 bg-gray-300" />
    <div className="h-4 ml-10 w-6/12 bg-gray-300" />
    <div className="h-4 ml-10 w-6/12 bg-gray-300" />
  </div>
);

const RichText = (props: RichTextProps) => {
  const { value: personalizeId } = props.fields?.PersonalizeID || {};
  const { isLoading, data } = usePersonalizeComponent(props, personalizeId);

  const fields = personalizeId ? data.fields : props.fields;

  //If PersonlizeID.value has value, then use CDP data otherwise use Props from Sitecore
  const {
    sectionTitle,
    sectionDescription,
    sectionLink,
    mainContent,
    tableContent,
    backgroundGradient,
  } = fields || {};

  const bgColorClass = useBackgroundGradient(backgroundGradient);
  const textColorClass = useTextColor(backgroundGradient);
  const className = props.className || props.params?.className || '';

  if ((personalizeId && !data.fields && !isLoading) || !props.fields) {
    return null;
  }

  if (personalizeId && isLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <div
      className={clsx(
        'rich-text-block flex flex-col pb-10 px-5 sm:px-16 sm:pb-10',
        className,
        bgColorClass,
        textColorClass
      )}
      id={props.params?.RenderingIdentifier}
    >
      <SectionTitle
        title={sectionTitle}
        subtitle={sectionDescription}
        link={sectionLink}
        isLoading={isLoading}
        className="!px-0"
      />
      <RichTextUI value={mainContent.value} />
      {tableContent && <RichTextUI value={tableContent?.value} />}
    </div>
  );
};

export default RichText;
