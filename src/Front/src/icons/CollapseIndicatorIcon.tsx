import { SVGIconProps } from '../types';

const CollapseIndicatorIcon = ({ size }: SVGIconProps) => (
  <svg width={size} height={size} viewBox="0 0 100 100">
    <circle cx={50} cy="50" r="6" className="fill-current" />
    <circle cx={50} cy="74" r="6" className="fill-current" />
    <circle cx={50} cy="26" r="6" className="fill-current" />
  </svg>
);

export default CollapseIndicatorIcon;
