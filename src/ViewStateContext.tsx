import { createContext, useCallback, useContext, useMemo, useState } from 'react';

import { CONFIRM_MODAL_ID } from './modal/ConfirmModal';

interface ViewStateContextProps {
  displayedModalId: string | null;
  isModalShowing: boolean;
  showConfirmationModal: (message: string, onConfirm: () => void) => void;
  hideModals: () => void;
  modalMessage?: string | null;
  modalOnConfirm?: (() => void) | null;
}

const ViewStateContext = createContext<ViewStateContextProps>({
  displayedModalId: null,
  isModalShowing: false,
  showConfirmationModal: () => {},
  hideModals: () => {},
  modalMessage: null,
  modalOnConfirm: null
});

const useViewState = () => {
  const context = useContext(ViewStateContext);
  if (!context) {
    throw new Error(`useViewState must be used within a ViewStateProvider`);
  }
  return context;
};

const ViewStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [displayedModalId, setDisplayedModalId] = useState<string | null>(null);
  const isModalShowing = !!displayedModalId;
  const [modalMessage, setModalMessage] = useState<string | null>(null);
  // const [modalOnConfirm, setModalOnConfirm] = useState<(() => void) | null>(null);
  const [modalOnConfirm, setModalOnConfirm] = useState<(() => void) | null>(null);


  const showConfirmationModal = useCallback((message: string, onConfirm: () => void) => {
    setModalMessage(message);
    setModalOnConfirm(() => onConfirm);
    setDisplayedModalId(CONFIRM_MODAL_ID);
  }, [setModalMessage, setModalOnConfirm, setDisplayedModalId]);

  const hideModals = useCallback(() => {
    setDisplayedModalId(null);
  }, [setDisplayedModalId]);

  const value = useMemo(() => ({
    displayedModalId,
    isModalShowing,
    showConfirmationModal,
    hideModals,
    modalMessage,
    modalOnConfirm
  }), [
    displayedModalId,
    isModalShowing,
    showConfirmationModal,
    hideModals,
    modalMessage,
    modalOnConfirm
  ]);

  return (
    <ViewStateContext.Provider value={value}>
      { children }
    </ViewStateContext.Provider>
  );
};

export { ViewStateProvider, useViewState };
