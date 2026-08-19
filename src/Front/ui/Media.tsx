import { Text, TextField, ImageField, NextImage } from '@sitecore-jss/sitecore-jss-nextjs';
import VideoModal from 'ui/VideoModal';

export interface MediaProps {
  thumbnail: ImageField;
  headline?: TextField;
  videoId?: TextField;
  withGradient?: boolean;
}

const Media = ({ thumbnail, headline, videoId, withGradient }: MediaProps) => (
  <div className="relative overflow-hidden h-full w-full">
    {thumbnail?.value?.src && (
      <>
        {withGradient && <span className="absolute inset-0 bg-gradient-to-t from-black-50 z-1" />}
        <NextImage field={thumbnail} className="absolute" objectFit="cover" fill={true} />
      </>
    )}
    <div className="absolute bottom-0 left-0 flex flex-col justify-end pl-5 pb-14 md:p-16 z-1">
      {Boolean(videoId?.value) && <VideoModal videoId={videoId?.value as string} />}
      {headline?.value && (
        <Text
          tag="div"
          className="headline-m md:headline-xl text-white-00 max-w-308 md:max-w-447"
          field={headline}
        />
      )}
    </div>
  </div>
);

export default Media;
