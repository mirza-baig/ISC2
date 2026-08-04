import { SVGIconProps } from '../types';

const ChevronSquaredDownIcon = ({ size, className }: SVGIconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12 16L18 10L16.59 8.59L12 13.17L7.41 8.59L6 10L12 16Z" className="fill-current" />
  </svg>
);

export default ChevronSquaredDownIcon;
