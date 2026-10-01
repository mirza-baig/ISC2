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

interface SubCategory {
  id: string;
  name?: string;
  displayname?: string;
  fields: {
    title?: TextField;
    link?: LinkField;
  };
}

interface ProductCategory {
  id: string;
  fields: {
    image?: ImageField;
    title?: TextField;
    'sub categories'?: SubCategory[];
  };
  children?: SubCategory[];
}

interface ProductCategoryGridFields {
  heading?: TextField;
  categories?: ProductCategory[];
}

type ProductCategoryGridProps = ComponentProps & {
  fields: {
    item?: ProductCategoryGridFields;
    props?: ProductCategoryGridFields;
    children?: ProductCategory[];
  };
};

const asItemList = <T,>(value: T[] | undefined): T[] => (Array.isArray(value) ? value : []);

const ProductCategoryGrid = ({ fields, params }: ProductCategoryGridProps): JSX.Element => {
  const renderingId = params?.RenderingIdentifier;
  const datasource = fields?.props ?? fields?.item;
  const selectedCategories = asItemList(datasource?.categories);
  const categories =
    selectedCategories.length > 0 ? selectedCategories : asItemList(fields?.children);

  return (
    <section
      id={renderingId || undefined}
      className={`component product-category-grid px-5 py-10 sm:px-16 ${params?.styles || ''}`}
    >
      <Text
        tag="h2"
        field={datasource?.heading}
        className="mb-6 text-2xl font-semibold leading-8 text-black-100"
      />

      <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {categories.map((category) => {
          const selectedSubCategories = asItemList(category.fields?.['sub categories']);
          const subCategories =
            selectedSubCategories.length > 0
              ? selectedSubCategories
              : asItemList(category.children);

          return (
            <article
              key={category.id}
              className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-lg border border-[#ccc] bg-white-00"
            >
              <div className="relative h-50 shrink-0 overflow-hidden">
                <NextImage field={category.fields?.image} fill className="object-cover" />
              </div>

              <div className="flex flex-col gap-5 p-6">
                <Text
                  tag="h3"
                  field={category.fields?.title}
                  className="m-0 text-2xl font-normal leading-9 tracking-[0.004375rem] text-black-100"
                />

                <ul className="m-0 list-none p-0">
                  {subCategories.map((subCategory, index) => {
                    const titleField = subCategory.fields?.title;
                    const linkField = subCategory.fields?.link;
                    const labelField: TextField = titleField?.value
                      ? titleField
                      : {
                          value:
                            linkField?.value?.text ||
                            subCategory.displayname ||
                            subCategory.name ||
                            '',
                        };
                    const isLast = index === subCategories.length - 1;
                    const rowClassName =
                      'group flex w-full items-center justify-between py-3 text-left text-xs font-normal leading-[1.125rem] tracking-[0.0375rem] text-[#666] transition-colors hover:text-isc2-green focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-isc2-green';

                    return (
                      <li key={subCategory.id}>
                        {linkField?.value?.href ? (
                          <Link prefetch={false} field={linkField} className={rowClassName}>
                            <Text tag="span" field={labelField} />
                            <span className="shrink-0 text-base leading-none text-[#666] group-hover:text-isc2-green">
                              <ChevronRightIcon size={16} />
                            </span>
                          </Link>
                        ) : (
                          <span className={rowClassName}>
                            <Text tag="span" field={labelField} />
                            <span className="shrink-0 text-base leading-none text-[#666]">
                              <ChevronRightIcon size={16} />
                            </span>
                          </span>
                        )}
                        {!isLast && <div className="h-px bg-[#ccc]" />}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};

export default withDatasourceCheck()<ProductCategoryGridProps>(ProductCategoryGrid);
