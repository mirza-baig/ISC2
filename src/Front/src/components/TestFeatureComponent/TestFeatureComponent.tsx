import { Field, Text } from '@sitecore-jss/sitecore-jss-nextjs';
import { useFeatureFlag } from 'providers/featureFlags';

interface Fields {
  Headline: Field<string>;
}

type TestFeatureComponentProps = {
  fields: Fields;
};

const TestFeatureComponent = ({ fields }: TestFeatureComponentProps): JSX.Element | null => {
  const isEnabled = useFeatureFlag('Test_Feature_Component');

  if (!isEnabled) {
    return null;
  }

  return (
    <div className="flex min-h-[300px] w-full items-center justify-center border-2 border-dashed border-gray-400 bg-gray-100 py-12">
      <h2 className="text-3xl font-bold">
        {fields?.Headline?.value ? <Text field={fields.Headline} /> : 'Test Component is Enabled!'}
      </h2>
    </div>
  );
};

export default TestFeatureComponent;
