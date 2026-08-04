import {
  ComponentRendering,
  Field,
  LinkField,
  RouteData,
  withDatasourceCheck,
} from '@sitecore-jss/sitecore-jss-nextjs';
import { ComponentProps } from 'lib/component-props';

import SectionTitle from 'ui/SectionTitle';
import LeadershipCard, { LeadershipCardProps } from './LeadershipCard';

interface Fields {
  children: LeadershipCardProps[];
  props: {
    sectionTitle: Field<string>;
    sectionDescription: Field<string>;
    sectionLink: LinkField;
  };
}

type LeadershipProps = ComponentProps & {
  rendering: ComponentRendering | RouteData;
  fields: Fields;
};

const Leadership = ({ fields }: LeadershipProps) => {
  if (!fields) {
    return null;
  }

  return (
    <section className="leadership flex flex-col items-center justify-center md:items-start px-5 md:px-44 pb-14 md:pb-40">
      <SectionTitle
        title={fields?.props?.sectionTitle}
        subtitle={fields?.props?.sectionDescription}
        link={fields?.props?.sectionLink}
      />
      <div className="grid w-full gap-20 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
        {(fields.children || []).map((child) => {
          if (!child) {
            return null;
          }

          return <LeadershipCard key={child.id} {...child} />;
        })}
      </div>
    </section>
  );
};

export default withDatasourceCheck()<LeadershipProps>(Leadership);
