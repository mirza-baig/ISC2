import { SVGIconProps } from '../types';

const CloseIcon = ({ size, className }: SVGIconProps) => (
  <svg width={size} height={size} className={className} viewBox="0 0 100 100">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M79.5515 84.101L20.4485 24.9979L20.4485 18.9875L79.5515 78.0905V84.101Z"
      className="fill-current stroke-current"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M79.4691 25.0723L20.731 83.8103L20.731 77.808L79.4691 19.0699L79.4691 25.0723Z"
      className="fill-current stroke-current"
    />
  </svg>
);

export default CloseIcon;
