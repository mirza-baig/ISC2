import { ImageField, NextImage, RichText } from '@sitecore-jss/sitecore-jss-nextjs';
import clsx from 'clsx';
import CloseIcon from 'icons/CloseIcon';

export interface CommunicationBannerFields {
  backgroundColor: string;
  fontColor: string;
  icon?: ImageField;
  message: string;
  isClosable?: boolean;
}

interface CommunicationBannerProps {
  fields: {
    bannerFields: {
      id: string;
      backgroundColor: string;
      fontColor: string;
      icon?: ImageField;
      message: string;
      isClosable?: boolean;
    };
    handleClose?: (id: string) => void;
    additionalClasses?: string;
  };
}

const CommunicationBanner = ({ fields }: CommunicationBannerProps) => {
  const { bannerFields, handleClose, additionalClasses } = fields;
  const { id, backgroundColor, fontColor, icon, message, isClosable = false } = bannerFields;

  return (
    <div
      key={id}
      className={clsx('flex relative p-2.5 mb-1 sm:px-7 sm:py-5 gap-3 sm:gap-5', additionalClasses)}
      style={{
        backgroundColor,
        color: fontColor,
      }}
    >
      {icon?.value?.src && <NextImage field={icon} size={32} className="w-8 h-8" />}
      <RichText
        className="w-full text-xs leading-5 sm:leading-6 sm:text-sm-base body-m [&_strong]:font-semibold [&_strong]:body-m"
        field={{ value: message }}
      />
      {isClosable && handleClose && (
        <button
          aria-label="Close banner"
          className="h-4"
          onClick={() => {
            handleClose(id);
          }}
        >
          <CloseIcon size={16} />
        </button>
      )}
    </div>
  );
};

export default CommunicationBanner;
