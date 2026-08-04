import React from 'react';

interface MenuButtonProps {
  isOpen: boolean;
  onClick: () => void;
}

const HamburgerButton: React.FC<MenuButtonProps> = ({ isOpen, onClick }) => {
  return (
    <button type="button" onClick={onClick} aria-label="Toggle navigation menu">
      {isOpen ? (
        <svg
          width="24"
          height="24"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            className="fill-current stroke-current"
            fillRule="evenodd"
            clipRule="evenodd"
            d="M79.5515 84.101L20.4485 24.9979L20.4485 18.9875L79.5515 78.0905V84.101Z"
            strokeWidth="0.5"
          />
          <path
            className="fill-current stroke-current"
            fillRule="evenodd"
            clipRule="evenodd"
            d="M79.4691 25.0723L20.731 83.8103L20.731 77.808L79.4691 19.0699L79.4691 25.0723Z"
            strokeWidth="0.5"
          />
        </svg>
      ) : (
        <svg viewBox="0 0 100 100" className="w-6 h-6 fill-current">
          <path
            className="fill-current stroke-current"
            fillRule="evenodd"
            clipRule="evenodd"
            d="M82.2794 68H13V63H87L82.2794 68Z"
          />
          <path
            className="fill-current stroke-current"
            fillRule="evenodd"
            clipRule="evenodd"
            d="M81.7353 37H13V32H87L81.7353 37Z"
          />
        </svg>
      )}
    </button>
  );
};

export default HamburgerButton;
