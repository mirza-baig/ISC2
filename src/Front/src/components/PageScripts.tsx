import { Field, withDatasourceCheck } from '@sitecore-jss/sitecore-jss-nextjs';
import { ComponentProps } from 'lib/component-props';

import { RichTextUI } from 'ui/index';

type PageScriptsProps = ComponentProps & {
  fields: {
    scriptData: Field<string>;
  };
};

const PageScript = ({ fields }: PageScriptsProps): JSX.Element => (
  <>
    <RichTextUI value={fields.scriptData.value} />
  </>
);

export default withDatasourceCheck()<PageScriptsProps>(PageScript);
