import { SVGIconProps } from '../types';

const ExternalLinkIcon = ({ size }: SVGIconProps) => (
  <>
    <svg width={size} height={size} viewBox="0 0 21 20" fill="none">
      <g clipPath="url(#clip0_2521_3141)">
        <path
          d="M15.5581 4.92824L10.958 4.90337L11.9367 5.88209L13.8469 5.91542L12.4024 7.35989L9.38914 10.3732L9.38914 11.77L12.9995 8.18486L14.5503 6.65932L14.5604 8.53316L15.5829 9.55571L15.5581 4.92824Z"
          className="fill-current"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M5.6001 4.90039H9.18413V5.90039H6.6001V14.1004H13.0317L14.5682 12.82V11.2273H15.5682V13.2884L13.3937 15.1004H5.6001V4.90039Z"
          className="fill-current"
        />
      </g>
      <defs>
        <clipPath id="clip0_2521_3141">
          <rect
            width="10.2"
            height="10.4"
            className="fill-current"
            transform="translate(5.5 4.80078)"
          />
        </clipPath>
      </defs>
    </svg>
  </>
);

export default ExternalLinkIcon;
