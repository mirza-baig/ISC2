import { SVGIconProps } from '../types';

const CartIcon = ({ size }: SVGIconProps) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M70.125 70.2306L78.736 36.7694H18.2634L26.8713 70.2306H70.125ZM23.0618 75H73.9341L85 32H12L23.0618 75Z"
      className="fill-current"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M37.8792 14H59.1208L65 16.8343V28H60.1555V19.7754L57.9903 18.7316H39.0097L36.8445 19.7754V28H32V16.8343L37.8792 14Z"
      className="fill-current"
    />
  </svg>
);

export default CartIcon;
