import {
  Field,
  ImageField,
  Link,
  LinkField,
  Text,
  withDatasourceCheck,
} from '@sitecore-jss/sitecore-jss-nextjs';
import { ComponentProps } from 'lib/component-props';

interface CallToActionHeroFields {
  backgroundImage: ImageField;
  heading: Field<string>;
  description: Field<string>;
  primaryCta: LinkField;
  secondaryCta: LinkField;
}

type CallToActionHeroProps = ComponentProps & {
  fields: CallToActionHeroFields;
};

const CallToActionHero = ({ fields, params }: CallToActionHeroProps): JSX.Element => {
  const backgroundImage = fields?.backgroundImage?.value?.src;
  const renderingId = params?.RenderingIdentifier;

  return (
    <section
      id={renderingId || undefined}
      className={`component call-to-action-hero relative isolate mt-36 overflow-hidden rounded-lg bg-cover bg-center px-5 py-10 sm:px-10 ${
        params?.styles || ''
      }`}
      style={backgroundImage ? { backgroundImage: `url("${backgroundImage}")` } : undefined}
    >
      <div className="absolute inset-0 z-0 bg-black/[0.45]" aria-hidden="true" />

      <div className="relative z-1 grid gap-3 text-center text-white-00">
        <h1 className="m-0 text-[2rem] font-bold leading-[1.15] sm:text-5xl">
          <Text field={fields?.heading} />
        </h1>

        <p className="m-0 text-base font-normal leading-6 sm:text-xl sm:leading-[1.5]">
          <Text field={fields?.description} />
        </p>

        <div className="flex flex-col items-center justify-center gap-4 pt-12 xs:flex-row">
          {fields?.primaryCta?.value?.href && (
            <Link
              field={fields.primaryCta}
              className="inline-flex min-h-[52px] items-center justify-center rounded bg-white-00 px-8 py-3.5 text-base font-semibold text-black-100 transition-shadow hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white-00"
            />
          )}

          {fields?.secondaryCta?.value?.href && (
            <Link
              field={fields.secondaryCta}
              className="inline-flex min-h-[52px] items-center justify-center rounded bg-white-00 px-8 py-3.5 text-base font-semibold text-black-100 transition-shadow hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white-00"
            />
          )}
        </div>
      </div>
    </section>
  );
};

export default withDatasourceCheck()<CallToActionHeroProps>(CallToActionHero);
