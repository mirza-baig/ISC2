import {
  ComponentRendering,
  Field,
  Placeholder,
  RouteData,
} from '@sitecore-jss/sitecore-jss-nextjs';
import { ComponentProps } from 'lib/component-props';
import { useLayout } from 'src/providers/layout';

type Fields = {
  tabName: Field<string>;
};

type HorizontalTabProps = ComponentProps & {
  rendering: ComponentRendering | RouteData;
  fields: Fields;
};

const HorizontalTab = ({ rendering, fields }: HorizontalTabProps) => {
  const { isEditing } = useLayout();

  return (
    <>
      {isEditing && (
        <button
          aria-label={fields?.tabName?.value}
          className="cta rounded-tag focus-dark-green border-2 border-isc2-green py-1 px-3 focus:border-gray-50"
        >
          {fields?.tabName?.value}
        </button>
      )}
      <Placeholder name="tab-content" rendering={rendering} />
    </>
  );
};

export default HorizontalTab;
