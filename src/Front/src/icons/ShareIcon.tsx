import { SVGIconProps } from '../types';

const ShareIcon = ({ size }: SVGIconProps) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M78.004 48.8357C38.7225 48.8357 19.3016 75.7402 14.4099 87.9695L9.51819 78.1861C11.9641 65.9568 36.1294 29.2688 78.004 29.2688L85.3416 39.0523L78.004 48.8357Z"
      className="fill-current"
    />
    <path
      d="M92.5916 38.9646L63.2412 68.4003V55.4599L86.1397 32.4944L92.5916 38.9646Z"
      className="fill-current"
    />
    <path
      d="M86.1397 45.4347L63.414 22.0853V9.69952L92.5916 38.9646L86.1397 45.4347Z"
      className="fill-current"
    />
  </svg>
);

export default ShareIcon;
