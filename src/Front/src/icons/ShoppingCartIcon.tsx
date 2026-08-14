import { SVGIconProps } from '../types';

const ShoppingCartIcon = ({ size }: SVGIconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      className="fill-current"
      fillRule="evenodd"
      clipRule="evenodd"
      d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.44C4.52 15.37 5.48 17 7 17h12v-2H7l1.1-2h7.45c.75 0 1.41-.41 1.75-1.03L21.7 4H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"
    />
  </svg>
);

export default ShoppingCartIcon;
