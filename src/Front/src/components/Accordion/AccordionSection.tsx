import { useCallback, useEffect, useRef } from 'react';
import { Field } from '@sitecore-jss/sitecore-jss-nextjs';
import clsx from 'clsx';
import { ComponentProps } from 'lib/component-props';

import { ChevronDownIcon } from 'icons/index';

import AccordionLinkItem, { AccordionLinkItemProps } from './AccordionLinkItem';
import AccordionRichTextItem, { AccordionRichTextItemProps } from './AccordionRichTextItem';

import { useToggle } from 'hooks/index';
import { useAnalyticsTracking } from 'hooks/index';
import { ANALYTICS_EVENTS } from 'constants/index';

export type AccordionSectionProps = ComponentProps & {
  fields: Fields;
  id: string;
  isRichText: boolean;
  openBackgroundColorClass?: string;
};

interface Fields {
  title: Field<string>;
  linkItems?: AccordionLinkItemProps[];
  richTextItems?: AccordionRichTextItemProps[];
  isAccordionOpen?: Field<boolean>;
}

const AccordionSection = (props: AccordionSectionProps) => {
  const { track } = useAnalyticsTracking();
  const isAccordionOpen = props?.fields?.isAccordionOpen?.value ?? false;
  const [isOpen, toggleOpen, setIsOpen] = useToggle(isAccordionOpen);
  const sectionRef = useRef<HTMLDivElement>(null);

  const createHashFromTitle = useCallback((title: string) => {
    return title.replace(/\s+/g, '%20');
  }, []);

  const titleForHash = props?.fields?.title?.value || '';
  const hashValue = createHashFromTitle(titleForHash);

  useEffect(() => {
    const handleHashChange = () => {
      if (typeof window !== 'undefined') {
        const currentHash = window.location.hash.slice(1);
        const decodedHash = decodeURIComponent(currentHash);

        if (decodedHash === titleForHash || currentHash === hashValue) {
          if (!isOpen) {
            setIsOpen(true);
            setTimeout(() => {
              sectionRef.current?.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
              });
            }, 100);
          }
        }
      }
    };

    handleHashChange();

    window.addEventListener('hashchange', handleHashChange);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [titleForHash, hashValue, isOpen, setIsOpen]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const currentHash = window.location.hash.slice(1);
      const decodedHash = decodeURIComponent(currentHash);

      if ((decodedHash === titleForHash || currentHash === hashValue) && !isOpen) {
        setIsOpen(true);
        setTimeout(() => {
          sectionRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          });
        }, 200);
      }
    }
  }, []);

  const toggleSection = useCallback(() => {
    const wasOpen = isOpen;
    toggleOpen();

    if (!wasOpen && typeof window !== 'undefined') {
      const newHash = `#${hashValue}`;
      window.history.pushState(null, '', newHash);
    }

    if (wasOpen && typeof window !== 'undefined') {
      const currentHash = window.location.hash.slice(1);
      const decodedHash = decodeURIComponent(currentHash);

      if (decodedHash === titleForHash || currentHash === hashValue) {
        window.history.pushState(null, '', window.location.pathname + window.location.search);
      }
    }

    if (!wasOpen) {
      track({
        event: ANALYTICS_EVENTS.GA_EVENT,
        type: 'engagement',
        subtype: 'accordion_open',
        click_text: titleForHash.toLowerCase() || '',
      });
    }
  }, [isOpen, titleForHash, hashValue, toggleOpen, track]);

  if (!props.fields?.linkItems?.length && !props.fields.richTextItems?.length) {
    return null;
  }

  return (
    <div
      ref={sectionRef}
      className={
        props.isRichText
          ? clsx(
              'border-t border-gray-05 p-7.5 transition-all',
              isOpen && props.openBackgroundColorClass
            )
          : 'border-b border-gray-70 py-6'
      }
    >
      <button
        className="flex justify-between items-center w-full"
        onClick={toggleSection}
        aria-label="Toggle"
        aria-expanded={isOpen}
      >
        <div className={`${props.isRichText ? 'headline-s text-start' : 'text-lime text-lg'}`}>
          {props.fields.title?.value}
        </div>
        <div
          className={
            props.isRichText
              ? `px-2 py-1 border border-gray-30 rounded-2xl ${clsx(
                  isOpen && 'bg-white-00 text-black-100'
                )}`
              : 'px-3 py-2 border border-gray-70 rounded-3xl hover:bg-gray-70 focus-lime'
          }
        >
          <ChevronDownIcon size={15} className={clsx(isOpen && 'rotate-180')} />
        </div>
      </button>
      <div
        className={clsx(
          'transition-height',
          isOpen && 'open',
          isOpen && props.isRichText && 'mt-7.5'
        )}
      >
        <div className={`overflow-hidden flex flex-col items-start`}>
          {(props.fields.linkItems || []).map((link, index) => (
            <AccordionLinkItem
              {...link}
              title={props.fields.title.value}
              disabled={!isOpen}
              key={`${link.fields.title}-${index}`}
            />
          ))}
          {(props.fields.richTextItems || []).map((link, index) => (
            <AccordionRichTextItem key={index} {...link} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default AccordionSection;
