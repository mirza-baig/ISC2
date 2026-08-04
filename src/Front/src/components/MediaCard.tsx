import { Text, TextField, ImageField } from '@sitecore-jss/sitecore-jss-nextjs';
import Media from 'ui/Media';

export interface MediaCard {
  fields: {
    thumbnail: ImageField;
    headline?: TextField;
    videoYouTubeId: TextField;
    videoCaption?: TextField;
  };
}

const MediaCard = ({ fields }: MediaCard) => (
  <>
    <div className="h-500 md:h-742 mb-14 md:mb-20">
      <Media
        thumbnail={fields?.thumbnail}
        videoId={fields?.videoYouTubeId}
        headline={fields?.headline}
        withGradient
      />
    </div>
    {fields?.videoCaption?.value && (
      <Text tag="div" className="body-s mt-4" field={fields?.videoCaption} />
    )}
  </>
);

export default MediaCard;
