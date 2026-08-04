import { EnvelopeIcon, FacebookIcon, LinkedinIcon, ShareIcon, XIcon, RssFeedIcon } from '../icons';
import {
  shareOnEmailLink,
  shareOnFacebookLink,
  shareOnLinkedinLink,
  shareOnX,
  currentUrl,
  rssFeedLink,
} from '../utils';

import TagsGroup from './TagsGroup';
import Tag from './Tag';

interface ShareProps {
  isOpen: boolean;
  toggleVisibility: () => void;
  showRssIcon: boolean;
  title?: string;
  rssFeedLabel?: string;
  shareButtonLabel?: string;
  shareOnEmailLabel?: string;
  shareOnFacebookLabel?: string;
  shareOnLinkedinLabel?: string;
  shareOnXLabel?: string;
}

const Share = ({
  isOpen,
  toggleVisibility,
  showRssIcon,
  title,
  rssFeedLabel = 'Subscribe to RSS feed',
  shareButtonLabel = 'Toggle Sharing Options',
  shareOnEmailLabel = 'Share this article in an email',
  shareOnFacebookLabel = 'Share this article on Facebook',
  shareOnLinkedinLabel = 'Share this article on LinkedIn',
  shareOnXLabel = 'Share this article on X',
}: ShareProps) => {
  const ITEMS = [
    {
      id: 'Linkedin',
      Icon: LinkedinIcon,
      share: shareOnLinkedinLink,
      ariaLabel: shareOnLinkedinLabel,
    },
    {
      id: 'Facebook',
      Icon: FacebookIcon,
      share: shareOnFacebookLink,
      ariaLabel: shareOnFacebookLabel,
    },
    {
      id: 'Envelope',
      Icon: EnvelopeIcon,
      share: shareOnEmailLink,
      ariaLabel: shareOnEmailLabel,
    },
    {
      id: 'X',
      Icon: XIcon,
      share: (url: string) => shareOnX(url, title),
      ariaLabel: shareOnXLabel,
    },
  ];

  if (showRssIcon) {
    ITEMS.push({
      id: 'RSS',
      Icon: RssFeedIcon,
      share: rssFeedLink,
      ariaLabel: rssFeedLabel,
    });
  }

  const openShareLink = (shareLink: string) => {
    window.open(shareLink, '_blank');
    toggleVisibility();
  };

  return (
    <TagsGroup
      isOpen={isOpen}
      toggleVisibility={toggleVisibility}
      OpenIcon={ShareIcon}
      items={ITEMS}
      className="!px-2"
      ariaLabel={shareButtonLabel}
      renderItem={(Item) => (
        <Tag
          key={Item.id}
          href={() => openShareLink(Item.share(currentUrl))}
          className="!px-2"
          ariaLabel={Item.ariaLabel}
        >
          <Item.Icon size={20} />
        </Tag>
      )}
    />
  );
};

export default Share;
