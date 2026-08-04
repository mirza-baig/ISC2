import {
  ComponentRendering,
  Field,
  ImageField,
  Link,
  LinkField,
  NextImage,
  TextField,
  Text,
  withDatasourceCheck,
  useSitecoreContext,
} from '@sitecore-jss/sitecore-jss-nextjs';
import { useMemo } from 'react';
import clsx from 'clsx';
import { ComponentProps } from 'lib/component-props';
import { useAnalyticsTracking, usePersonalizeComponent } from 'hooks/index';
import { SectionTitle } from 'ui/index';
import { formatBackgroundColorCssClassName, getContrastTextColor } from 'utils/index';
import { ANALYTICS_EVENTS } from 'constants/index';

interface ContentCard {
  fields: {
    description: TextField;
    eyebrow: TextField;
    headline: TextField;
    image: ImageField;
    primaryCta: LinkField;
    backgroundGradient: BackGroundGradient;
    contentHexColor: ContentHexColor;
    gradientOverlay: Field<boolean>;
  };
}
interface BackGroundGradient {
  name: string;
  fields: {
    backgroundGradient: {
      value: string;
    };
  };
}
interface ContentHexColor {
  name: string;
  fields: {
    contentHexColor: {
      value: string;
    };
  };
}

interface Fields {
  item: {
    heading?: Field<string>;
    usePageTitleForHeading?: Field<boolean>;
    description: Field<string>;
    link: LinkField;
    PersonalizeID?: Field<string>;
    promoPills: Field<string>;
  };
  children: ContentCard[];
}

type ContentComponentProps = ComponentProps & {
  rendering: ComponentRendering;
  fields: Fields;
};

const LoadingSkeleton = ({ className }: { className?: string }) => (
  <div
    className={clsx(
      'relative px-6 pb-6 aspect-square flex flex-col justify-end transition-all bg-gray-300 animate-pulse',
      className
    )}
  />
);

const ContentComponent = (props: ContentComponentProps) => {
  const { isLoading, data } = usePersonalizeComponent(
    props,
    props.fields.item.PersonalizeID?.value
  );

  const { track } = useAnalyticsTracking();

  const containerClass = useMemo(() => {
    switch (data.fields?.children.length) {
      case 1:
        return 'px-0 sm:px-16';

      case 2:
        return 'sm:grid-cols-2 px-5 sm:px-16';

      default:
        return 'sm:grid-cols-3 px-5 sm:px-16';
    }
  }, [data.fields?.children.length]);

  const borderRadiusClass = useMemo(() => {
    if (data.fields?.children.length === 1) {
      return 'rounded-none sm:rounded-lg';
    }

    return 'rounded-lg';
  }, [data.fields?.children.length]);

  const cardClass = useMemo(() => {
    if (data.fields?.children.length === 1) {
      return 'items-start sm:aspect-auto sm:py-16 sm:px-20 lg:px-40 sm:flex-row sm:items-center';
    }

    return 'sm:px-8 sm:pb-8 items-start';
  }, [data.fields?.children.length]);

  const buttonClass = useMemo(() => {
    switch (data.fields?.children.length) {
      case 1:
        return 'mt-10 sm:mt-0 primary-cta shadow-md border bg-white-00 !text-black-100 sm:ml-4 lg:ml-10';

      case 2:
        return 'mt-10 primary-cta bg-white-00 !text-black-100';

      default:
        return 'mt-10 with-chevron';
    }
  }, [data.fields?.children.length]);

  const trackCardClicked = (card: ContentCard) => {
    track({
      event: ANALYTICS_EVENTS.GA_EVENT,
      type: 'engagement',
      subtype: 'content_component_click',
      click_text: card.fields.headline.value,
      bo1: true, // business objective 1, Awareness
      element_id: card.fields.headline.value as string,
    });
  };

  const { sitecoreContext } = useSitecoreContext();

  const title = (
    data.fields?.item.usePageTitleForHeading?.value && sitecoreContext?.route?.fields?.pageTitle
      ? sitecoreContext?.route?.fields?.pageTitle
      : data.fields?.item.heading
  ) as Field<string>;

  return (
    <section className="space-y-8 sm:space-y-10 pb-14 sm:pb-20 content-component">
      <SectionTitle
        className="px-5 sm:px-16"
        title={title}
        subtitle={data.fields?.item.description}
        link={data.fields?.item.link}
        isLoading={isLoading}
      />

      <section
        className={clsx(
          'content-component-container flex flex-col gap-5 sm:grid sm:gap-8',
          containerClass
        )}
      >
        {data.fields?.children.map((card, index) => {
          if (isLoading) {
            return <LoadingSkeleton key={index} className={clsx(borderRadiusClass, cardClass)} />;
          }
          const bgColor = {
            name: card?.fields?.backgroundGradient?.name,
            fields: {
              Value: {
                value: card?.fields?.backgroundGradient?.fields?.backgroundGradient?.value,
              },
            },
          };
          const selectedcontentHexColor = card.fields.contentHexColor?.name?.toLowerCase() || '';

          const hasImage = Boolean(card.fields.image.value?.src);
          const textColorClass = hasImage ? 'text-white-00' : getContrastTextColor(bgColor);
          const descriptiontextColorClass =
            selectedcontentHexColor === 'white' || selectedcontentHexColor === ''
              ? 'text-white-00'
              : 'text-black-100';
          const needGradientOverlay = card.fields.gradientOverlay?.value;

          return (
            <Link
              key={index}
              onClick={() => trackCardClicked(card)}
              field={card.fields.primaryCta}
              className={clsx(
                'relative px-6 pb-6 aspect-square flex flex-col justify-end transition-all duration-500 shadow-md border content-component-link',
                hasImage && 'content-component-has-image',
                Boolean(card.fields.primaryCta?.value.href) && 'hover:scale-102 hover:shadow-lg',
                formatBackgroundColorCssClassName(bgColor),
                descriptiontextColorClass,
                borderRadiusClass,
                cardClass
              )}
            >
              {hasImage && (
                <>
                  {needGradientOverlay && (
                    <span
                      className={clsx(
                        'absolute inset-0 bg-gradient-to-t from-black-100 z-1',
                        borderRadiusClass
                      )}
                    />
                  )}
                  <NextImage
                    fill
                    field={card.fields.image}
                    className={clsx('object-cover', borderRadiusClass)}
                  />
                </>
              )}

              <div
                className={clsx(
                  'content-component-description z-1',
                  data.fields?.children.length === 1 && 'sm:flex-1'
                )}
              >
                {card.fields.eyebrow?.value && (
                  <span className="eyebrow mb-1">
                    <Text field={card.fields.eyebrow} />
                  </span>
                )}
                <h2 className="headline-s line-clamp-3">
                  <Text field={card.fields.headline} />
                </h2>
                {card.fields.description?.value && (
                  <label className="body-m mt-4 line-clamp-[8] cursor-pointer">
                    <Text field={card.fields.description} />
                  </label>
                )}
              </div>
              {Boolean(card.fields.primaryCta.value?.text) && (
                <div className={clsx('cta z-1', buttonClass, textColorClass)}>
                  {card.fields.primaryCta.value.text}
                </div>
              )}
            </Link>
          );
        })}
      </section>
    </section>
  );
};

export default withDatasourceCheck()<ContentComponentProps>(ContentComponent);
