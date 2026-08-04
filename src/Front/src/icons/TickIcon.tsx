import { SVGIconProps } from '../types';

const TickIcon = ({ size }: SVGIconProps) => (
  <svg width={size} height={size} viewBox="0 0 26 26" xmlns="http://www.w3.org/2000/svg">
    <path
      className="fill-isc2-green"
      fillRule="evenodd"
      clipRule="evenodd"
      d="M23.229 6.83781L11.8862 21.0163L3.14062 13.7283L4.13931 12.5299L11.6623 18.799L22.0109 5.86328L23.229 6.83781Z"
    />
  </svg>
);

export default TickIcon;
