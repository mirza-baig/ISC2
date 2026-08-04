import { SVGIconProps } from '../types';

const TickFilledIcon = ({ size, className }: SVGIconProps) => (
  <svg width={size} height={size} viewBox="0 0 14 14" className={className}>
    <rect width={size} height={size} rx="7" fill="white" />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M10.1474 5.10454L6.65726 9.46716L3.96631 7.2247L4.2736 6.85596L6.58836 8.78492L9.77255 4.80469L10.1474 5.10454Z"
      className="fill-isc2-green stroke-isc2-green"
    />
  </svg>
);

export default TickFilledIcon;
