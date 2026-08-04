import { SVGIconProps } from '../types';

const DateIcon = ({ size }: SVGIconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M18.9111 6.22144H5.08984V20.4002H16.0515L18.9111 18.0172V6.22144Z"
      className="stroke-current"
      strokeWidth="5"
    />

    <path d="M5.08984 9.31934H18.9111" className="stroke-current" strokeWidth="5" />

    <path
      d="M15.5742 3.60005L15.5742 7.77026L14.3827 7.77026L14.3827 4.76988L15.5742 3.60005Z"
      className="fill-current"
    />

    <path
      d="M9.61719 3.60005L9.61719 7.77026L8.4257 7.77026L8.4257 4.76988L9.61719 3.60005Z"
      className="fill-current"
    />
  </svg>
);

export default DateIcon;
