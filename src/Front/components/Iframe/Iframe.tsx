import {
  ComponentRendering,
  Field,
  LinkField,
  RouteData,
  withDatasourceCheck,
} from '@sitecore-jss/sitecore-jss-nextjs';
import { ComponentProps } from 'lib/component-props';
import SectionTitle from 'ui/SectionTitle';
import { useRouter } from 'next/router';
import { useCallback } from 'react';

type IframeProps = ComponentProps & {
  rendering: ComponentRendering | RouteData;
  fields: {
    headline: Field<string>;
    subHeadline: Field<string>;
    link: LinkField;
    sourceUrl: Field<string>;
  };
};

const Iframe = ({ fields }: IframeProps) => {
  const locationRoute = useRouter();
  const sourceUrl = fields?.sourceUrl?.value as string;

  const updatedURL = useCallback(() => {
    if (!locationRoute?.query || !sourceUrl) return sourceUrl;

    const [originAndPath, existingQuery] = sourceUrl.split('?');
    const existingParams = new URLSearchParams(existingQuery);

    Object.entries(locationRoute.query).forEach(([key, value]) => {
      if (value && typeof value === 'string') {
        existingParams.set(key, value);
      } else if (Array.isArray(value)) {
        existingParams.set(key, value[0] || '');
      }
    });

    return `${originAndPath}?${existingParams.toString()}`;
  }, [locationRoute?.query, sourceUrl]);

  return (
    <section className="iframe pb-14 sm:pb-20">
      <SectionTitle
        className="px-4 sm:px-16"
        title={fields?.headline}
        subtitle={fields?.subHeadline}
        link={fields.link}
      />
      <iframe
        src={
          locationRoute?.query && Object.keys(locationRoute.query).length > 0
            ? updatedURL()
            : sourceUrl
        }
        className="w-full h-dynamic-screen"
      />
    </section>
  );
};

export default withDatasourceCheck()<IframeProps>(Iframe);
