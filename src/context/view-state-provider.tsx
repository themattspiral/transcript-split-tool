
import { RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { TabId } from '../shared/data';
import { CONFIRM_MODAL_ID } from '../modal/confirm-modal';
import { CustomCSSVariables, ViewStateContext } from './view-state-context';

interface OutsideClickContext {
  outsideElementRef: RefObject<HTMLElement | null>,
  handler: () => void;
}

export const ViewStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTabId, setActiveTabId] = useState<TabId>(TabId.Transcript);
  const [displayedModalId, setDisplayedModalId] = useState<string | null>(null);
  const isModalShowing = !!displayedModalId;
  const [modalMessage, setModalMessage] = useState<string | null>(null);
  const [modalOnConfirm, setModalOnConfirm] = useState<(() => void) | null>(null);
  const outsideClickContextsRef = useRef<Set<OutsideClickContext>>(new Set());

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

  const registerOutsideClick = useCallback((outsideElementRef: RefObject<HTMLElement | null>, handler: () => void) => {
    outsideClickContextsRef.current.add({ outsideElementRef, handler });
  }, []);

  const unregisterOutsideClick = useCallback((outsideElementRef: RefObject<HTMLElement | null>, handler: () => void) => {
    outsideClickContextsRef.current.delete({ outsideElementRef, handler });
  }, []);

  const handleOutsideClick = useCallback((event: MouseEvent) => {

    for (const ctx of outsideClickContextsRef.current) {
      if (ctx.outsideElementRef.current && !ctx.outsideElementRef.current.contains(event.target as Node)) {
        console.log('outside click!');
        ctx.handler();
      }
    }
  }, []);

  useEffect(() => {
    window.addEventListener('click', handleOutsideClick);

    return () => {
      window.removeEventListener('click', handleOutsideClick);
    };
  }, [handleOutsideClick]);

  const value = useMemo(() => ({
    activeTabId, setActiveTabId,
    displayedModalId, isModalShowing, showConfirmationModal, hideModals,
    modalMessage, modalOnConfirm, registerOutsideClick, unregisterOutsideClick,
    cssVariables
  }), [
    activeTabId, setActiveTabId,
    displayedModalId, isModalShowing, showConfirmationModal, hideModals,
    modalMessage, modalOnConfirm, registerOutsideClick, unregisterOutsideClick,
    cssVariables
  ]);

  return (
    <ViewStateContext.Provider value={value}>
      { children }
    </ViewStateContext.Provider>
  );
};
