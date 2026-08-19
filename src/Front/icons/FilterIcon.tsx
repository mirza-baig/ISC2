import { SVGIconProps } from '../types';

const FilterIcon = ({ size, className }: SVGIconProps) => (
  <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M80.136 40H10V32H90L80.136 40Z"
      className="fill-current"
    />
    <circle cx="28" cy="36" r="7" fill="white" className="stroke-current" strokeWidth="6" />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M80.136 68H10V60H90L80.136 68Z"
      className="fill-current"
    />
    <circle cx="64" cy="64" r="7" fill="white" className="stroke-current" strokeWidth="6" />
  </svg>
);

export default FilterIcon;
