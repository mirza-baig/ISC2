import { SVGIconProps } from '../types';

const SheetIcon = ({ size, className }: SVGIconProps) => (
  <svg width={size} height={size} className={className} viewBox="0 0 16 20" fill="none">
    <path
      className="fill-current"
      fillRule="evenodd"
      clipRule="evenodd"
      d="M1.69355 18.3065H14.1129V6.33237H10H9.15323V5.4856V1.69355H1.69355V18.3065ZM10.8468 2.43536V4.63882H13.0502L10.8468 2.43536ZM1.69355 20H14.1129H15.8065V18.3065V5L10.8065 0H1.69355H0V1.69355V18.3065V20H1.69355Z"
    />
  </svg>
);

export default SheetIcon;
