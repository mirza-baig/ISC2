/* eslint-disable @typescript-eslint/no-empty-function */
import { createContext, useCallback, useContext, useEffect, useState } from 'react';

type ModalContextProps = {
  modalContent: React.ReactNode;
  modalConfig: ModalConfig | null;
  setModalContent: (modalContent: React.ReactNode, modalConfig?: ModalConfig) => void;
  closeModal: () => void;
};

const ModalContext = createContext<ModalContextProps>({
  modalContent: null,
  modalConfig: null,
  setModalContent: () => {},
  closeModal: () => {},
});

type ModalProviderProps = {
  children: React.ReactNode;
};

type ModalConfig = {
  dismissOnClickOutside?: boolean;
};

const ModalProvider: React.FC<ModalProviderProps> = ({ children }) => {
  const [modalContent, setModalContent] = useState<React.ReactNode>(null);
  const [modalConfig, setModalConfig] = useState<ModalConfig | null>(null);

  const closeModal = useCallback(() => {
    setModalContent(null);
    setModalConfig(null);
  }, []);

  const openModal = useCallback((modalContent: React.ReactNode, modalConfig?: ModalConfig) => {
    setModalContent(modalContent);
    setModalConfig({ dismissOnClickOutside: modalConfig?.dismissOnClickOutside ?? true });
  }, []);

  useEffect(() => {
    if (!document.body) {
      return;
    }

    document.body.style.overflow = modalContent ? 'hidden' : '';

    return () => {
      document.body.style.overflow = '';
    };
  }, [modalContent]);

  return (
    <ModalContext.Provider
      value={{
        modalContent,
        modalConfig,
        setModalContent: openModal,
        closeModal,
      }}
    >
      {children}
    </ModalContext.Provider>
  );
};

const useModal = () => useContext(ModalContext);

export { ModalProvider, useModal };
