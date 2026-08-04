import { useCallback, useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';

import { TickIcon } from 'icons/index';
import { useBreakpoint } from 'hooks/index';
import { useCheckoutProcess } from 'providers/index';

export default function CheckoutStepsIndicator() {
  const { activeStep, checkoutSteps } = useCheckoutProcess();

  const [circleLocation, setCircleLocation] = useState(0);
  const breakpoint = useBreakpoint();

  const activeIndex = useMemo(
    () => checkoutSteps.findIndex((step) => step.id === activeStep),
    [activeStep, checkoutSteps]
  );

  const calculateCircleLocation = useCallback(() => {
    const element = document.getElementById(activeStep);
    const newPosition = element!.offsetLeft + element!.clientWidth / 2;

    if (newPosition !== circleLocation) {
      setCircleLocation(newPosition);
    }
  }, [activeStep, circleLocation]);

  useEffect(() => {
    if (breakpoint) {
      calculateCircleLocation();
    }
  }, [breakpoint, calculateCircleLocation]);

  return (
    <header className="w-full mb-6 sm:mb-10 space-y-6 sm:space-y-5">
      <div className="space-x-2 flex items-center xs:space-x-20">
        {checkoutSteps.map((step, index) => (
          <span
            key={step.id}
            id={step.id}
            className={clsx(
              'body-m flex items-center max-xs:flex-1 space-x-2 py-2 px-3 rounded-xl sm:rounded-full',
              index > activeIndex && 'text-gray-50 border border-gray-50',
              index < activeIndex && 'text-black border border-isc2-green',
              index === activeIndex && 'text-white bg-isc2-green'
            )}
          >
            {index < activeIndex ? <TickIcon size={20} /> : <label>{index + 1}.</label>}
            <label>{step.label}</label>
          </span>
        ))}
      </div>
      <span className="h-px bg-gray-50 w-full flex relative">
        <span
          className="h-px bg-black left-0 absolute after:content-[''] after:block after:z-px after:absolute after:h-1 after:w-1 after:rounded-full after:bg-black after:right-0 after:bottom-1/2 after:translate-y-1/2 after:translate-x-1/2"
          style={{ width: circleLocation }}
        />
      </span>
    </header>
  );
}
