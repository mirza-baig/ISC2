import React, { useState } from 'react';
import clsx from 'clsx';
import { Text, Link, NextImage, ImageField, TextField } from '@sitecore-jss/sitecore-jss-nextjs';

import { NavigationLink as INavigationType } from 'types/index';

import { useAnalyticsTracking } from 'hooks/index';
import { ANALYTICS_EVENTS } from 'constants/index';

type ChevronProps = {
  isActive?: boolean;
  isHovered?: boolean;
  isLeft?: boolean;
  isLinkHovered?: boolean;
  isMainNavigationLink?: boolean;
  isTextLink?: boolean;
};

const ChevronSVG: React.FC<ChevronProps> = ({
  isActive = false,
  isHovered = false,
  isLeft = false,
  isLinkHovered = false,
  isMainNavigationLink = false,
  isTextLink = false,
}) => {
  const leftChevronClass = clsx('mr-4 h-2 w-3 pointer-events-none', {
    hidden: !isActive || !isMainNavigationLink,
    'inline md:hidden': isActive && isMainNavigationLink,
  });
  const upChevronClass = clsx('ml-2 h-2 w-3 pointer-events-none', {
    hidden: !isMainNavigationLink && !isTextLink,
    'hidden md:block': !isHovered && isActive && isMainNavigationLink,
    'md:opacity-0':
      (!isHovered && !isLinkHovered && !isActive && isMainNavigationLink) ||
      (!isMainNavigationLink && !isTextLink),
    'md:opacity-1 md:transform md:rotate-90': isTextLink,
    'opacity-1 transform rotate-90 md:opacity-1 md:transform md:rotate-180':
      (!isHovered && !isLinkHovered && !isActive && isMainNavigationLink) ||
      (isHovered && !isActive && isMainNavigationLink) ||
      (isLinkHovered && !isActive && isMainNavigationLink),
    '!h-4 !w-4': isMainNavigationLink,
  });

  const chevronClass = isLeft ? leftChevronClass : upChevronClass;
  const paths = isLeft ? (
    <>
      <path d="M29 50.6017L64 15.5L64 30.9312L36.6938 58.3173L29 50.6017Z" fill="black" />
      <path
        d="M36.6938 42.8861L63.7939 70.7301L63.7939 85.5L29 50.6017L36.6938 42.8861Z"
        fill="black"
      />
    </>
  ) : (
    <>
      <path d="M49.8983 33L85 68L69.5688 68L42.1827 40.6938L49.8983 33Z" fill="black" />
      <path
        d="M57.6139 40.6938L29.7699 67.7939L15 67.7939L49.8983 33L57.6139 40.6938Z"
        fill="black"
      />
    </>
  );

  return (
    <svg
      className={chevronClass}
      width="100"
      height="100"
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {paths}
    </svg>
  );
};

const NavLinkContent = ({
  text,
  logo,
  icon,
  isActive,
  isMainNavigationLink,
  isLink,
  isHovered,
  isLinkHovered,
  isTextLink,
  abstract,
}: {
  text?: string;
  logo?: ImageField;
  icon?: ImageField;
  isActive: boolean;
  isMainNavigationLink: boolean;
  isLink: boolean;
  isHovered?: boolean;
  isLinkHovered: boolean;
  isTextLink: boolean;
  abstract?: TextField;
}) => (
  <>
    <ChevronSVG isLeft isActive={isActive} isMainNavigationLink={isMainNavigationLink} />
    {logo?.value?.src && isLink && (
      <NextImage
        className="object-contain pointer-events-none"
        field={logo}
        width={68}
        height={68}
      />
    )}
    <div className="flex flex-col w-full pointer-events-none">
      <Text tag="div" className="w-full" field={{ value: text }} />

      {abstract && isLink && (
        <Text tag="div" className="body-s w-170 text-gray-70 line-clamp-2" field={abstract} />
      )}
    </div>
    {icon?.value?.src && (
      <NextImage className="object-contain ml-2" field={icon} width={12} height={8} />
    )}
    <ChevronSVG
      isActive={isActive}
      isHovered={isHovered}
      isLinkHovered={isLinkHovered}
      isMainNavigationLink={isMainNavigationLink}
      isTextLink={isTextLink}
    />
  </>
);

const NavigationLink: React.FC<INavigationType> = ({
  className,
  displayAs,
  fields,
  isActive,
  isHovered,
  tabIndex,
  id,
  onClick,
  onMouseEnter,
  onMouseLeave,
}) => {
  const [isLinkHovered, setLinkIsHovered] = useState(false);
  const { track } = useAnalyticsTracking();

  const isTextLink = displayAs === 'TextLink';
  const isHeadline = displayAs === 'Headline';
  const isMainNavigationLink = displayAs === 'MainNavigationLink';
  const isLink = !isTextLink && !isHeadline && !isMainNavigationLink;
  const logo = fields?.logo;

  const handleClick = (evt: React.MouseEvent): void => {
    evt.preventDefault();

    const anchorElement = evt.currentTarget as HTMLAnchorElement;
    const anchorText = anchorElement.innerText?.toLowerCase();
    const anchorHref = anchorElement.href?.toLowerCase();

    if (anchorHref) {
      track({
        event: ANALYTICS_EVENTS.GA_EVENT,
        type: 'engagement',
        subtype: 'navigation_click',
        bo1: true,
        click_text: anchorText,
        click_url: anchorHref,
      });

      window.location.href = anchorElement.href;
    }
  };

  const handleButtonClick = (evt: React.MouseEvent): void => {
    evt.preventDefault();

    const buttonElement = evt.currentTarget as HTMLButtonElement;
    const buttonText = buttonElement.innerText?.toLowerCase();

    track({
      event: ANALYTICS_EVENTS.GA_EVENT,
      type: 'engagement',
      subtype: 'navigation_click',
      bo1: true,
      click_text: buttonText,
    });

    if (onClick) {
      onClick();
    }
  };

  const handleMouseEnter = (): void => {
    setLinkIsHovered(true);

    if (onMouseEnter) {
      onMouseEnter();
    }
  };

  const handleMouseLeave = (): void => {
    setLinkIsHovered(false);

    if (onMouseLeave) {
      onMouseLeave();
    }
  };

  const linkClasses = clsx(
    'navigation-type cursor-pointer text-left px-4 py-2 flex justify-center items-center focus:outline-none focus:ring-2 focus:ring-isc2-green',
    {
      'hover:text-link-blue': isLink,
      'py-6 sm:py-4 w-full hover:text-black-100 md:px-3 md:py-1 md:block md:hover:bg-gray-30 md:active:bg-gray-30':
        isMainNavigationLink,
      rounded: !isMainNavigationLink,
      'md:w-full md:flex md:items-center md:justify-between md:rounded': isMainNavigationLink,
      'bg-transparent md:bg-gray-30': isActive && isMainNavigationLink,
      'eyebrow text-xs text-gray-70 tracking-wide': isHeadline,
      'body-m text-gray-70': !isActive && isTextLink,
      'text-black-100': isActive && isTextLink,
    },
    className
  );

  if (!fields?.link?.value?.text) {
    return null;
  }

  if (fields?.link?.value?.href) {
    return (
      <Link
        className={linkClasses}
        prefetch={false}
        field={fields?.link}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleMouseEnter}
        onBlur={handleMouseLeave}
      >
        <NavLinkContent
          {...{
            text: fields?.link?.value?.text,
            abstract: fields?.abstract,
            logo,
            icon: fields?.icon,
            isActive,
            isMainNavigationLink,
            isLink,
            isHovered,
            isLinkHovered,
            isTextLink,
          }}
        />
      </Link>
    );
  }

  return (
    <button
      className={linkClasses}
      onClick={handleButtonClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
      tabIndex={tabIndex}
      id={id}
      aria-label={fields?.link?.value?.text}
    >
      <NavLinkContent
        {...{
          text: fields?.link?.value?.text,
          abstract: fields?.abstract,
          logo,
          icon: fields?.icon,
          isActive,
          isMainNavigationLink,
          isLink,
          isHovered,
          isLinkHovered,
          isTextLink,
        }}
      />
    </button>
  );
};

export default NavigationLink;
