import { SVGIconProps } from '../types';

const ChevronRightIcon = ({ size }: SVGIconProps) => (
  <svg
    width={size / 2}
    height={size}
    viewBox="0 0 5 12"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M4.63945 6.0479L0.439453 10.2601L0.439453 8.40836L3.7162 5.12203L4.63945 6.0479Z"
      className="fill-current"
    />

    <path
      d="M3.7162 6.97377L0.464183 3.63249L0.464183 1.86011L4.63945 6.0479L3.7162 6.97377Z"
      className="fill-current"
    />
  </svg>
);

export default ChevronRightIcon;
