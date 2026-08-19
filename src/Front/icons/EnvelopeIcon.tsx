import { SVGIconProps } from '../types';

const EnvelopeIcon = ({ size }: SVGIconProps) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M5.15399 24.4028C5.15399 23.8505 5.60171 23.4028 6.15399 23.4028H94C94.5523 23.4028 95 23.8505 95 24.4028V32.357L50.5567 46.801L5.15399 32.2273V24.4028ZM5.15399 41.4716V75.5972C5.15399 76.1495 5.6207 76.5972 6.17299 76.5972C62.9381 76.5971 81.7048 76.5874 84.2533 76.5859C84.465 76.5858 84.6572 76.5185 84.8282 76.3936L94.5896 69.268C94.8475 69.0798 95 68.7797 95 68.4603V41.6097L50.5699 56.0495L5.15399 41.4716Z"
      className="fill-current"
    />
  </svg>
);

export default EnvelopeIcon;
