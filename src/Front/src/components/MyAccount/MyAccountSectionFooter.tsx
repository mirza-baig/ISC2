import { RichText, RichTextField } from '@sitecore-jss/sitecore-jss-nextjs';
import clsx from 'clsx';
import { ChevronRightIcon } from 'icons/index';

interface CTAProps {
  label?: string;
  target?: string;
  href?: string;
  type?: string;
  Icon?: JSX.Element;
  additionalClasses?: string;
  onClick?: () => void;
  isDisabled?: boolean;
}

interface MyAccountSectionFooterProps {
  label?: string | RichTextField;
  labelClasses?: string;
  primaryCTA?: CTAProps;
  secondaryCTA?: CTAProps;
}

const BUTTON_CLASSES = 'block w-max cta primary-cta px-4 sm:px-8 text-sm-base cursor-pointer';
const LABEL_CLASSES = 'text-sm-base font-semibold hover:underline';

const CtaLayout = ({
  label,
  href,
  target,
  type,
  Icon,
  additionalClasses,
  onClick,
  isDisabled,
}: CTAProps) => {
  if (type === 'button') {
    return (
      <button
        type="button"
        className={BUTTON_CLASSES}
        onClick={onClick}
        disabled={isDisabled}
        aria-label={label}
      >
        <span>{label}</span>
      </button>
    );
  }

  const linkTarget = target || '_self';
  const rel = linkTarget === '_blank' ? 'noopener noreferrer' : undefined;

  return (
    <a
      href={href || '#'}
      target={linkTarget}
      rel={rel}
      className={clsx(LABEL_CLASSES, additionalClasses)}
    >
      <span className="flex items-center space-x-2">
        <span>{label}</span>
        {Icon ?? <ChevronRightIcon size={15} />}
      </span>
    </a>
  );
};

const MyAccountSectionFooter = ({
  primaryCTA,
  secondaryCTA,
  label,
  labelClasses = 'text-isc2-green',
}: MyAccountSectionFooterProps) => {
  return (
    <div className="flex justify-between space-x-2 mt-5">
      <div className="flex items-center">
        {Boolean(label) &&
          (typeof label === 'string' ? (
            <span className={clsx('text-xs font-bold', labelClasses)}>{label}</span>
          ) : (
            <RichText className={clsx('text-xs font-bold')} field={label} />
          ))}
      </div>
      <div className="flex items-center justify-end sm:divide-x sm:divide-gray-30 gap-3">
        {Boolean(secondaryCTA?.label) && <CtaLayout {...secondaryCTA} />}
        {Boolean(primaryCTA?.label) && <CtaLayout {...primaryCTA} additionalClasses="md:pl-3" />}
      </div>
    </div>
  );
};

export default MyAccountSectionFooter;
