import clsx from 'clsx';
import { ProductThumbnail } from 'ui/ProductThumbnail';

export interface MyAccountSectionCardFields {
  name: string;
  labels?: { title?: string; content: string }[];
  image?: { src: string; alt: string };
  cta?: {
    type?: string;
    label: string;
    href?: string;
    target?: string;
    disabled?: boolean;
    tooltip?: string;
    supportingText?: string;
    supportingLinkHref?: string;
    supportingLinkLabel?: string;
    supportingLinkPostText?: string;
  };
  isHalfCard?: boolean;
  withBorder?: boolean;
  imagesAreLoading?: boolean;
}

interface MyAccountSectionCardProps {
  fields: MyAccountSectionCardFields;
}

const MyAccountSectionCard = ({ fields }: MyAccountSectionCardProps) => {
  const {
    name,
    labels,
    image,
    cta,
    isHalfCard = false,
    withBorder = true,
    imagesAreLoading = false,
  } = fields;

  return (
    <div
      className={clsx(
        'flex py-5 gap-x-8',
        withBorder && 'border-b border-gray-30',
        isHalfCard && 'flex-col sm:flex-row'
      )}
    >
      <div className={clsx('w-20 h-20 sm:content-center', !isHalfCard && 'sm:w-30 sm:h-30')}>
        {!imagesAreLoading && (
          <ProductThumbnail
            src={image?.src}
            alt={image?.alt}
            className="aspect-square"
            width={100}
            height={100}
          />
        )}
      </div>
      <div className={clsx('w-full flex gap-5 sm:gap-2', !isHalfCard && 'flex-col sm:flex-row')}>
        <div className={clsx('w-full flex flex-col self-center', !isHalfCard && 'gap-3')}>
          <div className={clsx('text-sm-base', !isHalfCard && 'sm:text-lg')}>{name}</div>
          {labels &&
            labels.map((label, index) => {
              return (
                <div
                  key={`${label.title}-${index}`}
                  className={clsx('text-xs', isHalfCard ? 'text-gray-70' : 'sm:text-sm-base')}
                >
                  {label.title && <strong>{`${label.title}: `}</strong>}
                  {label.content}
                </div>
              );
            })}
        </div>
        <div className={clsx(!isHalfCard && 'sm:self-center')}>
          {cta ? (
            cta.type === 'button' ? (
              cta.disabled ? (
                <div className="flex flex-col items-end" title={cta.tooltip}>
                  <button
                    disabled
                    className="block w-max cta primary-cta px-4 sm:px-8 text-sm-base disabled"
                    aria-label={cta.label}
                  >
                    {cta.label}
                  </button>
                  {(cta.supportingText || cta.supportingLinkHref) && (
                    <p className="text-xs text-gray-70 mt-1 text-right max-w-xs">
                      {cta.supportingText && `${cta.supportingText} `}
                      {cta.supportingLinkHref && cta.supportingLinkLabel && (
                        <a
                          href={cta.supportingLinkHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline"
                        >
                          {cta.supportingLinkLabel}
                        </a>
                      )}
                      {cta.supportingLinkPostText && ` ${cta.supportingLinkPostText}`}
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <a
                    href={cta.href}
                    target={cta.target}
                    className="block w-max cta primary-cta px-4 sm:px-8 text-sm-base"
                  >
                    {cta.label}
                  </a>
                  {cta.supportingText && (
                    <p className="text-xs text-gray-70 mt-1 text-center">{cta.supportingText}</p>
                  )}
                </div>
              )
            ) : (
              <div className="flex flex-col items-center">
                <span
                  className={clsx(
                    cta.type?.includes('pill')
                      ? [
                          cta.type,
                          'block w-max py-3 px-8 text-sm-base font-semibold tracking-tighter rounded-button',
                        ]
                      : 'block w-max text-sm-base font-bold'
                  )}
                  title={cta.tooltip}
                >
                  {cta.label}
                </span>
                {cta.supportingText && (
                  <p className="text-xs text-gray-70 mt-1 text-center">{cta.supportingText}</p>
                )}
              </div>
            )
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default MyAccountSectionCard;
