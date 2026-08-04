import clsx from 'clsx';

import { SVGIconProps } from '../types';

const ChevronDownIcon = ({ size, className }: SVGIconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    className={clsx('fill-current', className)}
  >
    <path d="M50.1017 68L15 33L30.4312 33L57.8173 60.3062L50.1017 68Z" className="fill-current" />
    <path
      d="M42.3861 60.3062L70.2301 33.2061L85 33.2061L50.1017 68L42.3861 60.3062Z"
      className="fill-current"
    />
  </svg>
);

export default ChevronDownIcon;
