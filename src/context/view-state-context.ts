import { createContext, useContext } from 'react';

import { TabId } from '../shared/data';
import { CustomCSSVariables } from './view-state-provider';

interface ViewStateContextProps {
  activeTabId: TabId;
  setActiveTabId: (tab: TabId) => void;
  displayedModalId: string | null;
  isModalShowing: boolean;
  showConfirmationModal: (message: string, onConfirm: () => void) => void;
  hideModals: () => void;
  modalMessage: string | null;
  modalOnConfirm: (() => void) | null;
  cssVariables: { [key in CustomCSSVariables]: string };
}

export const ViewStateContext = createContext<ViewStateContextProps>({
  activeTabId: TabId.Transcript,
  setActiveTabId: () => {},
  displayedModalId: null,
  isModalShowing: false,
  showConfirmationModal: () => {},
  hideModals: () => {},
  modalMessage: null,
  modalOnConfirm: null,
  cssVariables: {} as { [key in CustomCSSVariables]: string }
});

export const useViewState = () => {
  const context = useContext(ViewStateContext);
  if (!context) {
    throw new Error(`useViewState must be used within a ViewStateProvider`);
  }
  return context;
};
