import { Field } from '@sitecore-jss/sitecore-jss-nextjs';

interface Fields {
  horizontalRuleCheckbox: Field<boolean>;
}

type SpacerProps = {
  fields: Fields;
};

const Spacer = ({ fields }: SpacerProps) => (
  <section className="py-7 sm:py-10">
    {Boolean(fields.horizontalRuleCheckbox?.value) && <hr />}
  </section>
);

export default Spacer;
