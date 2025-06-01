
import { useCallback, useMemo, useState } from 'react';

import { ViewStateContext } from './view-state-context';
import { TabId } from '../shared/data';
import { CONFIRM_MODAL_ID } from '../modal/confirm-modal';

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

export const ViewStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTabId, setActiveTabId] = useState<TabId>(TabId.Transcript);
  const [displayedModalId, setDisplayedModalId] = useState<string | null>(null);
  const isModalShowing = !!displayedModalId;
  const [modalMessage, setModalMessage] = useState<string | null>(null);
  const [modalOnConfirm, setModalOnConfirm] = useState<(() => void) | null>(null);

  // fetch custom CSS variables that we may want to use programatically
  const cssVariables = useMemo(() => {
    const vars = {} as { [key in CustomCSSVariables]: string };

    const computedBodyStyles: CSSStyleDeclaration = window.getComputedStyle(document.body);
    Object.values(CustomCSSVariables).forEach(prop => {
      vars[prop] = computedBodyStyles.getPropertyValue(prop);
    });

    return vars;
  }, []);

  const showConfirmationModal = useCallback((message: string, onConfirm: () => void) => {
    setModalMessage(message);
    setModalOnConfirm(() => onConfirm);
    setDisplayedModalId(CONFIRM_MODAL_ID);
  }, [setDisplayedModalId, setModalMessage, setModalOnConfirm]);

  const hideModals = useCallback(() => {
    setDisplayedModalId(null);
    setModalMessage(null);
    setModalOnConfirm(null);
  }, [setDisplayedModalId, setModalMessage, setModalOnConfirm]);

  const value = useMemo(() => ({
    activeTabId, setActiveTabId,
    displayedModalId, isModalShowing, showConfirmationModal, hideModals,
    modalMessage, modalOnConfirm,
    cssVariables
  }), [
    activeTabId, setActiveTabId,
    displayedModalId, isModalShowing, showConfirmationModal, hideModals,
    modalMessage, modalOnConfirm,
    cssVariables
  ]);

  return (
    <ViewStateContext.Provider value={value}>
      { children }
    </ViewStateContext.Provider>
  );
};
