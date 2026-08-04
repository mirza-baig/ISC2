import {
  ComponentRendering,
  Field,
  Link,
  Text,
  RouteData,
  NextImage,
  withDatasourceCheck,
  LinkField,
  ImageField,
} from '@sitecore-jss/sitecore-jss-nextjs';
import { ComponentProps } from 'lib/component-props';

interface Logo {
  fields: {
    logoImage: ImageField;
    logoLink: LinkField;
  };
}

type LogoGridProps = ComponentProps & {
  rendering: ComponentRendering | RouteData;
  fields: {
    item: {
      heading: Field<string>;
    };
    children: Logo[];
  };
};

const LOGO_CLASS = 'relative h-14 md:h-22 w-23 md:w-36 flex justify-self-center';

function LogoGrid({ fields }: LogoGridProps) {
  if (!fields) return null;

  return (
    <section className="flex flex-col md:flex-row px-4 md:px-16 pb-14 md:pb-20 space-y-12 md:space-y-0">
      <Text tag="h2" className="headline-l px-5 md:px-0 md:mr-8" field={fields?.item?.heading} />
      <div className="grid grid-cols-3 gap-x-8 gap-y-9 md:grid-cols-4 md:gap-x-20 md:gap-y-14">
        {fields.children?.map((logo) => {
          const LogoContent = (
            <NextImage field={logo.fields.logoImage} fill className="object-contain" />
          );

          if (!logo.fields.logoLink?.value?.href) {
            return (
              <span key={logo.fields.logoImage.value?.src} className={LOGO_CLASS}>
                {LogoContent}
              </span>
            );
          }

          return (
            <Link
              key={logo.fields.logoImage.value?.src}
              field={logo.fields.logoLink}
              className={LOGO_CLASS}
              target="_blank"
            >
              {LogoContent}
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export default withDatasourceCheck()<LogoGridProps>(LogoGrid);
