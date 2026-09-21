import {
  ImageField,
  NextImage,
  Text,
  TextField,
  withDatasourceCheck,
} from '@sitecore-jss/sitecore-jss-nextjs';
import { ComponentProps } from 'lib/component-props';

interface CategoryHeaderBannerFields {
  heading: TextField;
  subheading: TextField;
  image: ImageField;
}

type CategoryHeaderBannerProps = ComponentProps & {
  fields: CategoryHeaderBannerFields;
};

const CategoryHeaderBanner = ({ fields, params }: CategoryHeaderBannerProps): JSX.Element => {
  const renderingId = params.RenderingIdentifier;

  return (
    <section
      id={renderingId || undefined}
      className={`component category-header-banner flex flex-wrap items-center overflow-hidden rounded-lg bg-gray-90 ${
        params.styles || ''
      }`}
    >
      <div className="flex min-h-[260px] min-w-[280px] flex-1 items-center justify-center px-6 py-4 text-center text-white-00">
        <div>
          <Text
            tag="h1"
            field={fields.heading}
            className="mb-3 mt-0 text-2xl font-semibold leading-[1.3]"
          />
          <Text tag="p" field={fields.subheading} className="m-0 text-base font-normal" />
        </div>
      </div>

      <div className="relative h-[260px] w-[603px] max-w-full shrink-0 overflow-hidden">
        <NextImage field={fields.image} fill className="object-cover" />
      </div>
    </section>
  );
};

export default withDatasourceCheck()<CategoryHeaderBannerProps>(CategoryHeaderBanner);
