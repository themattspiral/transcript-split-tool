import { createContext, RefObject, useContext } from 'react';

import { TabId } from '../shared/data';

export enum CustomCSSVariables {
  ColorRepetition = '--color-repetition',
  ColorRepetitionLite = '--color-repetition-lite',
  ColorRepetitionHeavy = '--color-repetition-heavy',
  ColorSource = '--color-source',
  ColorSourceLite = '--color-source-lite',
  ColorSourceHeavy = '--color-source-heavy',
  ColorOverlapping = '--color-overlapping',
  ColorOverlappingLite = '--color-overlapping-lite',
  ColorOverlappingHeavy = '--color-overlapping-heavy',
  ColorSpanBorder = '--color-span-border',
  ColorStructureArrows = '--color-structure-arrows',
  ColorBadge = '--color-badge',
  MenuActiveBgColor = '--contexify-activeItem-bgColor'
}

interface ViewStateContextProps {
  activeTabId: TabId;
  setActiveTabId: (tab: TabId) => void;
  displayedModalId: string | null;
  isModalShowing: boolean;
  confirmWithModal: (message: string) => Promise<void>;
  handleModalConfirm: () => void;
  handleModalCancel: () => void;
  modalMessage: string | null;
  registerOutsideClick: (outsideElementRef: RefObject<HTMLElement | null>, handler: () => void) => void;
  unregisterOutsideClick: (outsideElementRef: RefObject<HTMLElement | null>, handler: () => void) => void;
  cssVariables: { [key in CustomCSSVariables]: string };
}

export const ViewStateContext = createContext<ViewStateContextProps>({
  activeTabId: TabId.Transcript,
  setActiveTabId: () => {},
  displayedModalId: null,
  isModalShowing: false,
  confirmWithModal: () => Promise.reject(),
  handleModalConfirm: () => {},
  handleModalCancel: () => {},
  modalMessage: null,
  registerOutsideClick: () => {},
  unregisterOutsideClick: () => {},
  cssVariables: {} as { [key in CustomCSSVariables]: string }
});

export const useViewState = () => {
  const context = useContext(ViewStateContext);
  if (!context) {
    throw new Error(`useViewState must be used within a ViewStateProvider`);
  }
  return context;
};
