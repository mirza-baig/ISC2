import clsx from 'clsx';

import { SVGIconProps } from '../types';

const ArrowRightIcon = ({ size, className }: SVGIconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    className={clsx('fill-current', className)}
  >
    <path d="M90.002 49.4055L57.945 17V30.7149L71.0954 44.3323H16.1392L10 54.4728H70.8116L57.753 67.6725V82.0014L90.002 49.4055Z" />
  </svg>
);

export default ArrowRightIcon;
