import { createContext, ReactNode, RefObject, useContext } from 'react';

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
  displayedModalId: string | null;
  isModalShowing: boolean;
  isModalCancellable: boolean;
  confirmModal: (content: ReactNode) => Promise<void>;
  infoModal: (content: ReactNode) => Promise<void>;
  busyModal: (content: ReactNode, cancellable?: boolean) => void;
  handleModalConfirm: () => void;
  handleModalCancel: () => void;
  hideModals: () => void;
  modalContent: ReactNode | null;
  registerOutsideClick: (outsideElementRef: RefObject<HTMLElement | null>, handler: () => void) => void;
  unregisterOutsideClick: (outsideElementRef: RefObject<HTMLElement | null>, handler: () => void) => void;
  cssVariables: { [key in CustomCSSVariables]: string };
}

export const ViewStateContext = createContext<ViewStateContextProps>({
  displayedModalId: null,
  isModalShowing: false,
  isModalCancellable: false,
  confirmModal: () => Promise.reject(0),
  infoModal: () => Promise.reject(0),
  busyModal: () => {},
  handleModalConfirm: () => {},
  handleModalCancel: () => {},
  hideModals: () => {},
  modalContent: null,
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
