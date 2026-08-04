import clsx from 'clsx';
import { useRef } from 'react';

import useOnEventOutside from 'hooks/useOnEventOutside';
import useToggle from 'hooks/useToggle';
import { TooltipPosition } from 'types/index';

interface TooltipProps {
  Component: JSX.Element;
  content: string | number;
  position: TooltipPosition;
  className?: string;
  containerClasses?: string;
}

const TOOLTIP_POSITION_CLASS = {
  left: 'right-full top-2/4 -translate-y-1/2 mr-2 border-r border-t',
  right: 'left-full top-2/4 -translate-y-1/2 ml-2 border-l border-t',
  top: 'right-2/4 translate-x-1/2 bottom-full mb-2 border',
  bottom: 'right-2/4 translate-x-1/2 top-full mt-2 border-t border-x',
};

const TOOLTIP_ARROW_POSITION_CLASS = {
  left: '-right-1.5 top-2/4 -translate-y-1/2 border-r border-t',
  right: '-left-1.5 top-2/4 -translate-y-1/2 border-b border-l',
  top: 'right-2/4 translate-x-1/2 bottom-0 translate-y-1/2 border-b border-r',
  bottom: 'right-2/4 translate-x-1/2 bottom-full translate-y-1/2 border-t border-l',
};

const Tooltip = ({ Component, content, position, className, containerClasses }: TooltipProps) => {
  const [isOpen, toggleIsOpen, setIsOpen] = useToggle(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useOnEventOutside(tooltipRef, ['mousedown', 'touchstart'], () => setIsOpen(false));

  const onTooltipClick = (ev: { preventDefault: () => void }) => {
    ev.preventDefault();

    toggleIsOpen();
  };

  return (
    <div
      ref={tooltipRef}
      className={clsx('relative cursor-pointer', containerClasses)}
      onClick={onTooltipClick}
    >
      {Component}
      {isOpen && (
        <span
          className={clsx(
            'absolute w-66 px-4 py-2 bg-white-00 rounded-lg body-s shadow-lg z-tooltip cursor-default',
            className,
            TOOLTIP_POSITION_CLASS[position]
          )}
        >
          {content}
          <div
            className={clsx(
              'h-3 w-3 bg-white-00 rotate-45 shadow-lg absolute',
              TOOLTIP_ARROW_POSITION_CLASS[position]
            )}
          />
        </span>
      )}
    </div>
  );
};

export default Tooltip;
