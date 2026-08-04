import { useMemo } from 'react';
import clsx from 'clsx';

import { PauseIcon, PlayIcon } from 'src/icons';

interface CarouselIndicatorsProps {
  count: number;
  active: number;
  paused: boolean;
  onIconClick: () => void;
  onIndicatorClick: (index: number) => void;
  className?: string;
  lightMode: boolean;
  percentage: number;
}

const CarouselIndicators = ({
  count,
  className,
  active,
  paused,
  lightMode,
  onIconClick,
  onIndicatorClick,
  percentage,
}: CarouselIndicatorsProps) => {
  const indicators = Array.from(Array(count).keys());

  const Icon = useMemo(() => (paused ? PlayIcon : PauseIcon), [paused]);

  return (
    <section className={clsx('flex items-center space-x-1', className)}>
      <button
        className={clsx(
          'w-6 h-5 border flex items-center justify-center rounded-3xl border-black-100',
          lightMode && 'border-white-00 text-white-00'
        )}
        onClick={onIconClick}
        aria-label={paused ? 'play' : 'stop'}
      >
        <Icon size={14} />
      </button>

      {indicators.map((indicator) => (
        <button
          onClick={() => onIndicatorClick(indicator)}
          disabled={indicator === active}
          key={indicator}
          className={clsx(
            'h-3 border border-black-100 rounded-lg items-center flex p-0.5 transition-width duration-500',
            lightMode && 'border-white-00'
          )}
          style={{
            width: indicator === active ? '36px' : '12px',
          }}
          aria-label="Carousel indicator"
        >
          <div
            className={clsx(
              'rounded-lg h-full',
              lightMode ? 'bg-white-00' : 'bg-black-100',
              indicator === active ? 'opacity-100' : 'opacity-0'
            )}
            style={{
              width: indicator === active ? `${100 - percentage}%` : '0px',
            }}
          />
        </button>
      ))}
    </section>
  );
};

export default CarouselIndicators;
