import { SVGIconProps } from '../types';

const DownloadIcon = ({ size, className }: SVGIconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M8 0.888916V10.2222M8 10.2222L11.5556 6.66669M8 10.2222L4.44444 6.66669M1.33333 12.4445V13.7778C1.33333 14.5142 1.93028 15.1112 2.66667 15.1112H13.3333C14.0697 15.1112 14.6667 14.5142 14.6667 13.7778V12.4445"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default DownloadIcon;
