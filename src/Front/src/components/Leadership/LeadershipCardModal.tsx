import { useCallback } from 'react';
import { Link, NextImage, Text } from '@sitecore-jss/sitecore-jss-nextjs';

import { CloseIcon } from 'icons/index';
import { useAnalyticsTracking } from 'hooks/index';
import { LeadershipCardFields, SocialProfileLink } from 'types/index';
import { RichTextUI } from 'ui/index';
import { useModal } from 'providers/index';
import { ANALYTICS_EVENTS } from 'constants/index';

interface LeadershipCardModal {
  className?: string;
  socialProfileLinks?: SocialProfileLink[];
  fields: LeadershipCardFields;
}

const LeadershipCardModal = ({ className, socialProfileLinks, fields }: LeadershipCardModal) => {
  const { track } = useAnalyticsTracking();
  const { setModalContent, closeModal } = useModal();

  const openLeadershipModal = useCallback(() => {
    setModalContent(
      <>
        <div className="pt-24 p-5 xl:px-0 md:py-20 xl:py-30 w-full h-dynamic-screen max-w-8xl mx-auto relative">
          <div className="flex flex-col md:flex-row-reverse rounded-md overflow-y-auto bg-white-00 p-0 h-full md:p-10">
            <div className="aspect-square shrink-0 w-full sm:max-h-100 md:max-h-none md:aspect-none md:h-full md:w-400 xl:w-600 md:ml-12 relative">
              <NextImage
                className="aspect-square md:rounded-md w-full object-cover"
                field={fields?.image}
                fill
              />
            </div>
            <div className="p-5 pb-12 md:flex-1 md:p-0 md:pt-15 flex flex-col">
              <div className="space-y-4 md:space-y-1 mb-5 md:mb-6">
                <Text tag="h2" className="headline-m" field={fields?.nameCertification} />
                {Boolean(fields?.location?.value) && (
                  <Text tag="div" className="body-l text-gray-70" field={fields?.location} />
                )}
                {Boolean(fields?.title?.value) && (
                  <Text tag="div" className="body-l" field={fields?.title} />
                )}
              </div>

              <div className="space-y-8 md:space-y-6 overflow-auto pr-4 slider-scrollbar cursor-default">
                {Boolean(fields?.description?.value) && (
                  <RichTextUI className="body-m mb-1" value={fields?.description?.value} />
                )}
                <div className="flex flex-col items-start body-l space-y-2">
                  {(socialProfileLinks || []).map((link) => {
                    if (!link?.fields?.ctaLink) {
                      return null;
                    }

                    const text = link.fields.label.value || link.fields.ctaLink.value.text;

                    return (
                      <Link
                        key={link.fields.ctaLink.value.href}
                        field={{
                          value: {
                            ...link.fields.ctaLink.value,
                            text,
                          },
                        }}
                        className="primary-cta light !p-1 !text-link-blue underline decoration-dotted focus-isc2-green cursor-pointer"
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
          <button
            className="absolute top-6 right-5 md:top-7 xl:right-0 xl:top-12 py-1 px-2 rounded-full bg-white-00 text-black-100"
            onClick={closeModal}
            aria-label="Close"
          >
            <CloseIcon size={20} />
          </button>
        </div>
      </>
    );

    track({
      event: ANALYTICS_EVENTS.GA_EVENT,
      type: 'engagement',
      subtype: 'leadership_read_more_click',
      bo1: true, // business objective 1, Awareness
      bo3: true, // business objective 3, Loyalty and Retention
      click_text: fields?.ctaLabel?.value || '',
    });
  }, [
    track,
    setModalContent,
    closeModal,
    fields?.ctaLabel?.value,
    fields?.description?.value,
    fields?.image,
    fields?.location,
    fields?.nameCertification,
    fields?.title,
    socialProfileLinks,
  ]);

  if (!fields) {
    return null;
  }

  return (
    <div className={className}>
      <button
        className="primary-cta light p-0 focus-underline-dark-green with-chevron focus:outline-none"
        onClick={openLeadershipModal}
        aria-label={fields?.ctaLabel?.value}
      >
        <Text tag="span" field={fields?.ctaLabel} />
      </button>
    </div>
  );
};

export default LeadershipCardModal;
