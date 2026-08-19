/* eslint-disable @typescript-eslint/no-empty-function */
import { createContext, useCallback, useContext, useState } from 'react';

import { FlashAlert as TFlashAlert, RouteFields } from 'types/index';
import { FlashAlert } from 'ui/index';

type LayoutContextProps = {
  isMiniCartOpen: boolean;
  openMiniCart: () => void;
  closeMiniCart: () => void;
  addFlashAlert: (flashAlert: TFlashAlert) => void;
  isEditing: boolean;
  layoutFields?: RouteFields;
};

const LayoutContext = createContext<LayoutContextProps>({
  isEditing: false,
  isMiniCartOpen: false,
  openMiniCart: () => {},
  closeMiniCart: () => {},
  addFlashAlert: () => {},
  layoutFields: {} as RouteFields,
});

type HeaderNavigationProviderProps = {
  fields?: RouteFields;
  isEditing?: boolean;
  children: React.ReactNode;
};

const LayoutProvider: React.FC<HeaderNavigationProviderProps> = ({
  fields,
  children,
  isEditing = false,
}) => {
  const [flashAlerts, setFlashAlerts] = useState<TFlashAlert[]>([]);
  const [isMiniCartOpen, setIsMiniCartOpen] = useState(false);

  const openMiniCart = useCallback(() => setIsMiniCartOpen(true), []);

  const closeMiniCart = useCallback(() => setIsMiniCartOpen(false), []);

  const closeAlert = useCallback((index = 0) => {
    setFlashAlerts((prevFlashAlerts) => prevFlashAlerts.filter((_, i) => i !== index));
  }, []);

  const addFlashAlert = useCallback((flashAlert: TFlashAlert) => {
    setFlashAlerts((prevFlashAlerts) => [flashAlert, ...prevFlashAlerts]);
  }, []);

  return (
    <LayoutContext.Provider
      value={{
        isMiniCartOpen,
        openMiniCart,
        closeMiniCart,
        addFlashAlert,
        isEditing,
        layoutFields: fields,
      }}
    >
      <div className="fixed flex flex-col top-3 space-y-3 z-flash-alert self-center">
        {flashAlerts.map((flashAlert, index) => (
          <FlashAlert
            key={`${flashAlert.type}-${index}`}
            dismissAlert={closeAlert}
            closeAlert={closeAlert.bind(null, index)}
            flashAlert={flashAlert}
          />
        ))}
      </div>
      {children}
    </LayoutContext.Provider>
  );
};

const useLayout = () => useContext(LayoutContext);

export { LayoutProvider, useLayout };
