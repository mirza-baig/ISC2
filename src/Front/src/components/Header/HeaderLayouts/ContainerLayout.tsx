import { useCallback } from 'react';

import { useHeaderNavigation } from 'providers/index';

import ColumnLayout from './ColumnLayout';
import VerticalTabLayout from './VerticalTabLayout';

const ContainerLayout = () => {
  const { selectedMenuItem, setSelectedMenuItem } = useHeaderNavigation();

  const onBackButtonClick = useCallback(() => {
    setSelectedMenuItem(null);
  }, [setSelectedMenuItem]);

  if (selectedMenuItem?.tabs?.length) {
    return <VerticalTabLayout onBackButtonClick={onBackButtonClick} />;
  }

  if (selectedMenuItem?.columnLinks?.length) {
    return <ColumnLayout onBackButtonClick={onBackButtonClick} />;
  }

  return null;
};

export default ContainerLayout;
