import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useModal } from 'providers/index';
import { RichTextField, RichText } from '@sitecore-jss/sitecore-jss-nextjs';

export namespace DynamicPopup {
  export type PopupEventTrigger = {
    id: string;
    url: string;
    name: string;
    displayName: string;
    fields: {
      Value: {
        value: string;
      };
    };
  };

  export type BackgroundGradient = {
    id: string;
    url: string;
    name: string;
    displayName: string;
    fields: {
      backgroundGradient: {
        value: string;
      };
      contentHexColor: {
        value: string;
      };
    };
  };

  export type ContentHexColor = {
    id: string;
    url: string;
    name: string;
    displayName: string;
    fields: {
      Value: {
        value: string;
      };
    };
  };

  export type Props = {
    fields: {
      ShowOnLoadTimer: {
        value: string;
      };
      CssTrigger: {
        value: string;
      };
      PopupEventTrigger: PopupEventTrigger;
      Description: RichTextField;
      Heading: {
        value: string;
      };
      BackgroundGradient: BackgroundGradient;
      ContentHexColor: ContentHexColor;
    };
  };
}

export const DynamicPopup = ({ fields }: DynamicPopup.Props) => {
  const { setModalContent, closeModal } = useModal();
  const [hasShown, setHasShown] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const exitIntentRef = useRef<boolean>(false);

  const {
    ShowOnLoadTimer,
    CssTrigger,
    PopupEventTrigger,
    Description,
    Heading,
    BackgroundGradient,
    ContentHexColor,
  } = fields;

  const triggerType = PopupEventTrigger?.fields?.Value?.value || '';
  const timerDelay = parseInt(ShowOnLoadTimer?.value || '0', 10);
  const cssTrigger = CssTrigger?.value || '';

  const backgroundClass = BackgroundGradient?.fields?.backgroundGradient?.value || '';
  const contentColor =
    ContentHexColor?.fields?.Value?.value ||
    BackgroundGradient?.fields?.contentHexColor?.value ||
    '#000000';

  const showPopup = useCallback(() => {
    if (
      hasShown &&
      (triggerType === 'Timer' || triggerType === 'On Load' || triggerType === 'On Exit')
    )
      return;

    if (triggerType === 'Timer' || triggerType === 'On Load' || triggerType === 'On Exit') {
      setHasShown(true);
    }

    setModalContent(
      <DynamicPopupContent
        heading={Heading?.value}
        description={Description}
        backgroundClass={backgroundClass}
        contentColor={contentColor}
        onClose={closeModal}
      />,
      {
        dismissOnClickOutside: true,
      }
    );
  }, [
    hasShown,
    triggerType,
    setModalContent,
    Heading?.value,
    Description,
    backgroundClass,
    contentColor,
    closeModal,
  ]);

  useEffect(() => {
    if (triggerType === 'On Load') {
      const timeoutId = setTimeout(() => {
        showPopup();
      }, 100);
      return () => clearTimeout(timeoutId);
    } else if (triggerType === 'Timer' && timerDelay > 0) {
      timerRef.current = setTimeout(() => {
        showPopup();
      }, timerDelay);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [triggerType, timerDelay, hasShown, showPopup]);

  useEffect(() => {
    if (triggerType === 'On click' && cssTrigger) {
      const handleClick = (event: Event) => {
        const target = event.target as HTMLElement;
        const anchor = target.closest('a');

        if (anchor && anchor.getAttribute('href') === `#${cssTrigger}`) {
          event.preventDefault();
          showPopup();
        }
      };

      document.addEventListener('click', handleClick);

      return () => {
        document.removeEventListener('click', handleClick);
      };
    }
  }, [triggerType, cssTrigger, hasShown, showPopup]);

  useEffect(() => {
    if (triggerType === 'On Exit') {
      const handleMouseLeave = (event: MouseEvent) => {
        if (event.clientY <= 0 && !exitIntentRef.current) {
          exitIntentRef.current = true;
          showPopup();
        }
      };

      const handleMouseEnter = () => {
        exitIntentRef.current = false;
      };

      document.addEventListener('mouseleave', handleMouseLeave);
      document.addEventListener('mouseenter', handleMouseEnter);

      return () => {
        document.removeEventListener('mouseleave', handleMouseLeave);
        document.removeEventListener('mouseenter', handleMouseEnter);
      };
    }
  }, [triggerType, hasShown, showPopup]);

  return null;
};

const DynamicPopupContent = ({
  heading,
  description,
  backgroundClass,
  contentColor,
  onClose,
}: {
  heading?: string;
  description: RichTextField;
  backgroundClass?: string;
  contentColor?: string;
  onClose: () => void;
}) => {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target?.dataset?.action === 'close-popup') {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [onClose]);

  return (
    <div className="m-auto max-h-full flex justify-center items-center">
      <div
        className={`${
          backgroundClass ? `bg-${backgroundClass}` : 'bg-white-00'
        } rounded-lg py-2 relative`}
        style={{ color: contentColor }}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-current hover:opacity-70 transition-opacity z-10"
          aria-label="Close popup"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M18 6L6 18M6 6L18 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <div className="px-12 py-12 text-current max-w-[90vw] max-h-[90vh] overflow-auto">
          {heading && (
            <h4 className="headline-s font-normal mb-6 pr-8" style={{ color: contentColor }}>
              {heading}
            </h4>
          )}

          {description && (
            <div className="prose prose-sm max-w-none mb-8" style={{ color: contentColor }}>
              <RichText field={description} tag="div" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DynamicPopup;
