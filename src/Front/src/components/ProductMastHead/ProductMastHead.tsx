import clsx from 'clsx';
import {
  ComponentRendering,
  Field,
  ImageField,
  Link,
  LinkField,
  NextImage,
  RouteData,
  Text,
} from '@sitecore-jss/sitecore-jss-nextjs';
import { ComponentProps } from 'lib/component-props';

import { useAnalyticsTracking } from 'hooks/index';
import { ColorSelector } from 'types/index';
import { getTailwindColorClass } from 'utils/colors';
import PromoPill from 'ui/PromoPill';
import { ANALYTICS_EVENTS } from 'constants/index';

interface Fields {
  backgroundColorSelector: ColorSelector;
  description?: Field<string>;
  headline: Field<string>;
  logoImage?: ImageField;
  headlinePill?: Field<string>;
  primaryCTA?: LinkField;
  secondaryCTA?: LinkField;
}

export type ProductMastHead = ComponentProps & {
  rendering: ComponentRendering | RouteData;
  fields?: Fields;
};

const ProductMastHead = ({ fields }: ProductMastHead) => {
  const backgroundColorClass = getTailwindColorClass(
    fields?.backgroundColorSelector?.fields?.backgroundColorHexCode?.value || '',
    'bg'
  );

  const textColorClass = getTailwindColorClass(
    fields?.backgroundColorSelector?.fields?.foregroundColorHexCode?.value || '',
    'text'
  );

  const { track } = useAnalyticsTracking();

  const handleCTAClick = (event: React.MouseEvent<HTMLAnchorElement>): void => {
    track({
      event: ANALYTICS_EVENTS.GA_EVENT,
      type: 'lead',
      subtype: 'pdp_cta_click',
      bo1: true,
      bo2: true,
      click_text: event.currentTarget.textContent?.toLowerCase() || '',
      click_url: event.currentTarget.href?.toLowerCase() || '',
    });
  };

  if (!fields) {
    return null;
  }

  return (
    <header
      className={clsx(
        'relative flex flex-col items-center md:flex-row-reverse w-full block-container mb-20 px-5 pb-64 pt-36 min-h-500 sm:pt-32 md:pt-48 md:pb-13 md:px-14 xl:px-24 md:min-h-408',
        backgroundColorClass
      )}
    >
      <section
        className={clsx(
          'flex flex-col relative max-md:w-full max-lg:w-[62%] space-y-4 md:space-y-6',
          textColorClass
        )}
      >
        <span className="h-7">
          {fields?.headlinePill?.value && (
            <PromoPill className="bg-black bg-opacity-20 !py-1" field={fields.headlinePill} />
          )}
        </span>

        <h1 className="headline-l xl:headline-xl xl:leading-60 break-words md:line-clamp-3 md:w-full lg:w-686 xl:w-742">
          {fields.headline?.value}
        </h1>

        {fields.description && (
          <Text tag="div" field={fields.description} className="body-s md:body-m" />
        )}

        <div className="flex flex-row mt-6 lg:mt-8 w-full lg:w-auto">
          {fields?.primaryCTA?.value?.href && fields.primaryCTA?.value?.text && (
            <Link
              className="primary-cta light w-full text-center md:w-auto mr-6 lg:mr8 px-4 py-2"
              field={fields?.primaryCTA}
              onClick={handleCTAClick}
            />
          )}
          {fields?.secondaryCTA?.value?.href && fields?.secondaryCTA?.value?.text && (
            <Link
              className="secondary-cta light text-center w-full md:w-auto px-4 py-2"
              field={fields?.secondaryCTA}
              onClick={handleCTAClick}
            />
          )}
        </div>
      </section>
      <div className="overflow-x-hidden min-h-500 sm:min-h-0 absolute w-full md:w-494 xl:w-547 self-center sm:aspect-square -bottom-1/3 md:-left-10 lg:left-15 xl:left-10 max-xs:bottom-[-30%] md:bottom-[-40%] xl:bottom-[-42%] pointer-events-none">
        <div className="absolute w-500 md:w-494 xl:w-547 left-1/2 -translate-x-1/2 bottom-0 aspect-square">
          <NextImage field={fields.logoImage} priority fill />
        </div>
      </div>
    </header>
  );
};

export default ProductMastHead;
