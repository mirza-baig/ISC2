import { SVGIconProps } from '../types';

const SearchIcon = ({ size, className }: SVGIconProps) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className={className}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M83.7323 87.2678L73.5 77.0355L73.5 69.9644L87 83.4644L83.7323 87.2678Z"
      className="fill-current"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M47.5 77C63.7924 77 77 63.7924 77 47.5C77 31.2076 63.7924 18 47.5 18C31.2076 18 18 31.2076 18 47.5C18 63.7924 31.2076 77 47.5 77ZM47.5 82C66.5538 82 82 66.5538 82 47.5C82 28.4462 66.5538 13 47.5 13C28.4462 13 13 28.4462 13 47.5C13 66.5538 28.4462 82 47.5 82Z"
      className="fill-current"
    />
  </svg>
);

export default SearchIcon;
