import { ComponentRendering, Placeholder, RouteData } from '@sitecore-jss/sitecore-jss-nextjs';
import { ComponentProps } from 'lib/component-props';
import { useCallback, useRef } from 'react';

import { useHeaderNavigation } from 'providers/index';
import { useBreakpoint, useOnEventOutside } from 'hooks/index';

type ContainerProps = ComponentProps & {
  rendering: ComponentRendering | RouteData;
};

const HeaderContainer = ({ rendering }: ContainerProps) => {
  const navRef = useRef<HTMLDivElement>(null);

  const { closeAllNavigation } = useHeaderNavigation();
  const breakpoint = useBreakpoint();

  const onClickOutside = useCallback(() => {
    if (breakpoint !== 'sm') {
      closeAllNavigation();
    }
  }, [breakpoint, closeAllNavigation]);

  useOnEventOutside(navRef, ['mousedown', 'touchstart'], onClickOutside);

  return (
    <div ref={navRef}>
      <div className="absolute z-user-menu flex max-sm:left-4 max-sm:right-4 md:right-16 sm:right-12">
        <Placeholder name="container-top-right-header" rendering={rendering} />
      </div>
      <Placeholder name="container-header-navigation" rendering={rendering} />
    </div>
  );
};

export default HeaderContainer;
