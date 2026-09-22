import {
  ImageField,
  Link,
  LinkField,
  NextImage,
  Text,
  TextField,
  withDatasourceCheck,
} from '@sitecore-jss/sitecore-jss-nextjs';
import { ChevronRightIcon } from 'icons/index';
import { ComponentProps } from 'lib/component-props';

interface ProductCategoryLink {
  id: string;
  fields: {
    link: LinkField;
  };
}

interface ProductCategory {
  id: string;
  fields: {
    image: ImageField;
    title: TextField;
  };
  children?: ProductCategoryLink[];
}

type ProductCategoryGridProps = ComponentProps & {
  fields: {
    item: {
      heading: TextField;
    };
    children?: ProductCategory[];
  };
};

const ProductCategoryGrid = ({ fields, params }: ProductCategoryGridProps): JSX.Element => {
  const renderingId = params?.RenderingIdentifier;

  return (
    <section
      id={renderingId || undefined}
      className={`component product-category-grid px-5 py-10 sm:px-16 ${params?.styles || ''}`}
    >
      <Text
        tag="h2"
        field={fields?.item?.heading}
        className="mb-6 text-2xl font-semibold leading-8 text-black-100"
      />

      <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {(fields?.children || []).map((category) => (
          <article
            key={category.id}
            className="flex min-w-0 flex-col overflow-hidden rounded-lg border border-[#ccc] bg-white-00"
          >
            <div className="relative h-50 shrink-0 overflow-hidden">
              <NextImage field={category.fields?.image} fill className="object-cover" />
            </div>

            <div className="flex flex-1 flex-col gap-5 p-6">
              <Text
                tag="h3"
                field={category.fields?.title}
                className="m-0 text-2xl font-normal leading-9 tracking-[0.004375rem] text-black-100"
              />

              <ul className="m-0 list-none p-0">
                {(category.children || []).map((categoryLink) => (
                  <li key={categoryLink.id} className="border-b border-[#ccc] last:border-b-0">
                    <Link
                      prefetch={false}
                      field={categoryLink.fields?.link}
                      className="group flex w-full items-center justify-between py-3 text-left text-xs font-normal leading-[1.125rem] tracking-[0.0375rem] text-gray-70 transition-colors hover:text-isc2-green focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-isc2-green"
                    >
                      <span>{categoryLink.fields?.link?.value?.text}</span>
                      <span className="shrink-0 transition-transform group-hover:translate-x-0.5">
                        <ChevronRightIcon size={16} />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default withDatasourceCheck()<ProductCategoryGridProps>(ProductCategoryGrid);
