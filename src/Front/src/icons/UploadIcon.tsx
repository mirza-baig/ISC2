import { SVGIconProps } from '../types';

const UploadIcon = ({ size }: SVGIconProps) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <path
      d="M7.25 11V4.8875L5.13562 7.00188L2.93493 7.06507L8 2L13.0651 7.06507L10.8644 7.00188L8.75 4.8875V11H7.25ZM2 14V10.25H3.5V12.5H12.5V10.25H14V14H2Z"
      className="fill-current"
    />
  </svg>
);

export default UploadIcon;
