import { SVGIconProps } from '../types';

const TrashIcon = ({ size }: SVGIconProps) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <path
      className="fill-current"
      fillRule="evenodd"
      clipRule="evenodd"
      d="M5 5.80005V15.6L7.2 17.4H12.9L15.1 15.6V5.80005H5ZM13.3 14.7L12 15.8H7.9L6.6 14.7V7.50005H13.3V14.7Z"
    />
    <path
      className="fill-current"
      d="M15.3002 3.09995H12.9002L12.1002 2.19995H7.9002L7.1002 3.09995H4.7002L3.7002 4.69995H16.3002L15.3002 3.09995Z"
    />
  </svg>
);

export default TrashIcon;
