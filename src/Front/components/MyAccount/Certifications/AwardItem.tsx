import { convertDateToReadableFormat, extractAlt, extractSrc } from 'utils/index';

interface AwardItemProps {
  image: string;
  name: string;
  awardedDate: string;
  expiredDate: string;
  awardedDateLabel: string;
  expirationDateLabel: string;
}

export const AwardItem = ({
  image,
  name,
  awardedDate,
  expiredDate,
  awardedDateLabel,
  expirationDateLabel,
}: AwardItemProps) => {
  const getImageSrc = () => {
    const src = extractSrc(image);
    if (src) {
      return `${process.env.NEXT_PUBLIC_SALESFORCE_AUTHURL || ''}${src}`;
    }

    return '';
  };

  return (
    <div className="flex gap-3 items-center w-full">
      <img
        src={getImageSrc()}
        alt={extractAlt(image)}
        className="w-16 aspect-square object-contain"
      />
      <div className="flex flex-col justify-evenly h-full">
        <span className="text-isc2-green text-sm tracking-normal font-semibold">{name}</span>
        <div className="flex flex-col">
          <span className="text-xxsm text-gray-90 tracking-normal leading-4">
            {awardedDateLabel} {convertDateToReadableFormat(awardedDate)}
          </span>
          <span className="text-xxsm text-gray-90 tracking-normal leading-4">
            {expirationDateLabel} {convertDateToReadableFormat(expiredDate)}
          </span>
        </div>
      </div>
    </div>
  );
};
