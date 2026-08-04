import { Field, LinkField } from '@sitecore-jss/sitecore-jss-nextjs';
import { Autoplay } from 'swiper';
import { Swiper, SwiperSlide } from 'swiper/react';
import { useCallback, useEffect, useState } from 'react';

import { SectionTitle } from 'src/ui';
import { useAnalyticsTracking, usePersonalizeComponent, useToggle } from 'src/hooks';
import { useHeaderNavigation } from 'providers/index';

import HeroCard, { HeroCardProps } from '../HeroCard/HeroCard';
import TestimonialCard, { TestimonialCardProps } from '../Testimonial';
import CarouselIndicators from './CarouselIndicators/CarouselIndicators';
import { ANALYTICS_EVENTS } from 'constants/index';

type CardProps = HeroCardProps | TestimonialCardProps;

interface Fields {
  item: {
    PersonalizeID?: Field<string>;
    sectionTitle: Field<string>;
    sectionDescription: Field<string>;
    sectionLink: LinkField;
  };
  children: CardProps[];
}

export type CarouselProps = {
  fields: Fields;
};

interface SwiperClass {
  slideToLoop: (slideIndex: number, speed?: number) => void;
  autoplay: {
    resume: () => void;
    pause: () => void;
  };
}

const isTestimonialCard = (card: CardProps): card is TestimonialCardProps =>
  'testimonialQuote' in card.fields;

const Carousel = (props: CarouselProps) => {
  const { isLoading, data } = usePersonalizeComponent(
    props,
    props.fields.item.PersonalizeID?.value
  );

  const [paused, togglePaused, setPaused] = useToggle(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [percentage, setPercentage] = useState(0);
  const { isOpen, isSearchOpen } = useHeaderNavigation();
  const [swiper, setSwiper] = useState<SwiperClass>();
  const { track } = useAnalyticsTracking();

  const trackSlideImpression = useCallback(
    (slideId: string, type: string) => {
      track({
        event: ANALYTICS_EVENTS.GA_EVENT,
        type: 'engagement',
        subtype:
          type === 'indicatorClick' ? 'carousel_slide_cta_click' : 'carousel_slide_impression',
        bo1: true,
        element_id: slideId,
      });
    },
    [track]
  );

  useEffect(() => {
    setPaused(isOpen || isSearchOpen);
  }, [isOpen, isSearchOpen, setPaused]);

  useEffect(() => {
    if (swiper?.autoplay && paused) {
      swiper.autoplay.pause();
    }

    if (swiper?.autoplay && !paused) {
      swiper.autoplay.resume();
    }
  }, [paused, swiper]);

  const onSlideChange = useCallback(
    (newSlideIndex: number) => {
      setActiveSlide(newSlideIndex);

      const slide = data.fields.children[newSlideIndex];
      if (slide && slide.id) {
        trackSlideImpression(slide.id, 'slideChange');
      }

      if (paused && swiper?.autoplay) {
        togglePaused();
        swiper.autoplay.resume();
      }
    },
    [paused, swiper, togglePaused, trackSlideImpression, data.fields?.children]
  );

  const onIndicatorClick = useCallback(
    (slideIndex: number) => {
      if (swiper) {
        const slide = data.fields.children[slideIndex];
        swiper.slideToLoop(slideIndex, 500);
        trackSlideImpression(slide.id, 'indicatorClick');
      }
    },
    [swiper, data.fields?.children, trackSlideImpression]
  );

  const renderCard = useCallback(
    (item: CardProps) => {
      const Content = isTestimonialCard(item) ? (
        <TestimonialCard {...item} key={`card-${item.id}`} />
      ) : (
        <HeroCard {...item} key={`card-${item.id}`} />
      );

      if (data.fields.children.length > 1) {
        return <SwiperSlide key={item.id}>{Content}</SwiperSlide>;
      }

      return Content;
    },
    [data.fields.children.length]
  );

  return (
    <section className="relative mb-14 md:mb-20">
      <SectionTitle
        title={data.fields?.item.sectionTitle}
        subtitle={data.fields?.item.sectionDescription}
        link={data.fields?.item.sectionLink}
        isLoading={isLoading}
      />
      <Swiper
        modules={[Autoplay]}
        spaceBetween={0}
        slidesPerView={1}
        autoHeight
        grabCursor={!isLoading}
        allowSlidePrev={!isLoading}
        allowSlideNext={!isLoading}
        loop
        speed={500}
        onSwiper={setSwiper}
        onResize={() => {
          if (paused) {
            setPaused(false);
          }
        }}
        onAutoplayTimeLeft={(swiper, _timeLeft, percentage: number) => {
          if (!swiper.autoplay.paused) {
            setPercentage(percentage * 100);
          }
        }}
        onSlideChangeTransitionEnd={({ realIndex }) => onSlideChange(realIndex)}
        autoplay={
          data.fields?.children.length > 1
            ? {
                delay: 5000,
                disableOnInteraction: false,
              }
            : false
        }
      >
        {data.fields.children.map(renderCard)}
      </Swiper>

      {data.fields?.children.length > 1 && !isLoading && (
        <CarouselIndicators
          count={data.fields?.children.length}
          active={activeSlide}
          paused={paused}
          percentage={percentage}
          onIconClick={togglePaused}
          onIndicatorClick={onIndicatorClick}
          lightMode={Boolean(data.fields?.children[activeSlide].fields.imageFullWidth?.value)}
          className="absolute left-5 bottom-14 sm:left-auto sm:right-16 sm:bottom-8 z-10"
        />
      )}
    </section>
  );
};

export default Carousel;
