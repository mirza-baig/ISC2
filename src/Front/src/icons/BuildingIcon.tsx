import { SVGIconProps } from '../types';

const BuildingIcon = ({ size = 16, className }: SVGIconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <path
      d="M2.5 14.5V3.5C2.5 2.94772 2.94772 2.5 3.5 2.5H8.5C9.05228 2.5 9.5 2.94772 9.5 3.5V5.5H12.5C13.0523 5.5 13.5 5.94772 13.5 6.5V14.5H2.5Z"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinejoin="round"
    />
    <path
      d="M5 5.5H7M5 8H7M5 10.5H7M10.5 8H11.5M10.5 10.5H11.5"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
    />
    <path
      d="M7 14.5V12C7 11.7239 7.22386 11.5 7.5 11.5H8.5C8.77614 11.5 9 11.7239 9 12V14.5"
      stroke="currentColor"
      strokeWidth="1.25"
    />
  </svg>
);

export default BuildingIcon;
