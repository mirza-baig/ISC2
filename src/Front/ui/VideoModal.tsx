import { ReactElement, useCallback } from 'react';
import YouTube, { YouTubeProps } from 'react-youtube';

import { SVGIconProps } from 'types/index';
import { CloseIcon, PlayIcon } from 'icons/index';
import { useAnalyticsTracking } from 'hooks/index';
import { useModal } from 'providers/index';
import { ANALYTICS_EVENTS } from 'constants/index';

const VIDEO_OPTIONS: YouTubeProps['opts'] = {
  playerVars: {
    // https://developers.google.com/youtube/player_parameters
    autoplay: 1,
  },
};

type VideoModalProps = {
  className?: string;
  videoId: string;
  icon?: ReactElement<SVGIconProps>;
};

const VideoModal = ({ className, icon, videoId }: VideoModalProps) => {
  const { track } = useAnalyticsTracking();
  const { setModalContent, closeModal } = useModal();

  const trackVideoReady = useCallback(() => {
    track({
      event: ANALYTICS_EVENTS.GA_EVENT,
      type: 'engagement',
      subtype: 'video',
      bo1: true,
      element_id: videoId,
    });
  }, [track, videoId]);

  const openVideoModal = useCallback(() => {
    setModalContent(
      <>
        <div className="m-auto md:max-w-screen-xl">
          <YouTube
            className="video-modal relative overflow-hidden w-full aspect-video"
            videoId={videoId}
            opts={VIDEO_OPTIONS}
            onReady={trackVideoReady}
          />
        </div>
        <button
          className="absolute top-0 right-0 m-4 py-1 px-2 rounded-full bg-white-00 text-black-100"
          onClick={closeModal}
          aria-label="close"
        >
          <CloseIcon size={20} />
        </button>
      </>
    );
  }, [videoId, trackVideoReady, closeModal, setModalContent]);

  return (
    <div className={className}>
      <button
        className="mb-2 py-2 px-4 rounded-full bg-white-00 text-black-100"
        onClick={openVideoModal}
        aria-label="play"
      >
        {icon || <PlayIcon size={24} />}
      </button>
    </div>
  );
};

export default VideoModal;
