import { SVGIconProps } from '../types';

const PauseIcon = ({ size }: SVGIconProps) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M29.4284 80L29.4284 21L43.4761 21L43.4761 80L29.4284 80Z"
      className="fill-current"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M57.5239 80L57.5239 21L71.5715 21L71.5715 80L57.5239 80Z"
      className="fill-current"
    />
  </svg>
);

export default PauseIcon;
