
import { ReactNode, RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { TabId } from '../shared/data';
import { CustomCSSVariables, ViewStateContext } from './view-state-context';
import { CONFIRM_MODAL_ID } from '../modal/confirm-modal';
import { INFO_MODAL_ID } from '../modal/info-modal';
import { BUSY_MODAL_ID } from '../modal/busy-modal';

interface OutsideClickContext {
  outsideElementRef: RefObject<HTMLElement | null>,
  handler: () => void;
}

export const ViewStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTabId, setActiveTabId] = useState<TabId>(TabId.Transcript);
  const [displayedModalId, setDisplayedModalId] = useState<string | null>(null);
  const isModalShowing = !!displayedModalId;
  const [modalContent, setModalContent] = useState<ReactNode | null>(null);
  const outsideClickContextsRef = useRef<Set<OutsideClickContext>>(new Set());

  const modalResolve = useRef<() => void | null>(null);
  const modalReject = useRef<() => void | null>(null);

  const hideModals = useCallback(() => {
    setDisplayedModalId(null);
    setModalContent(null);
    modalResolve.current = null;
    modalReject.current = null;
  }, [setDisplayedModalId, setModalContent, modalResolve, modalReject]);

  // called by modal buttons
  const handleModalConfirm = useCallback(() => {
    if (modalResolve.current) {
      modalResolve.current();
      hideModals();
    }
  }, [modalResolve, hideModals]);

  const handleModalCancel = useCallback(() => {
    if (modalReject.current) {
      modalReject.current();
      hideModals();
    }
  }, [modalReject, hideModals, modalResolve, modalReject]);

  const confirmModal = useCallback(async (content: ReactNode): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
      setModalContent(content);
      setDisplayedModalId(CONFIRM_MODAL_ID);
      modalResolve.current = resolve;
      modalReject.current = reject;
    });
  }, [setDisplayedModalId, setModalContent, modalResolve, modalReject]);

  const infoModal = useCallback(async (content: ReactNode): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
      setModalContent(content);
      setDisplayedModalId(INFO_MODAL_ID);
      modalResolve.current = resolve;
    });
  }, [setDisplayedModalId, setModalContent, modalResolve]);

  const busyModal = useCallback((content: ReactNode) => {
    setModalContent(content);
    setDisplayedModalId(BUSY_MODAL_ID);
  }, [setDisplayedModalId, setModalContent]);

  // fetch custom CSS variables that we may want to use programatically
  const cssVariables = useMemo(() => {
    const vars = {} as { [key in CustomCSSVariables]: string };

    const computedBodyStyles: CSSStyleDeclaration = window.getComputedStyle(document.body);
    Object.values(CustomCSSVariables).forEach(prop => {
      vars[prop] = computedBodyStyles.getPropertyValue(prop);
    });

    return vars;
  }, []);

  const registerOutsideClick = useCallback((outsideElementRef: RefObject<HTMLElement | null>, handler: () => void) => {
    outsideClickContextsRef.current.add({ outsideElementRef, handler });
  }, []);

  const unregisterOutsideClick = useCallback((outsideElementRef: RefObject<HTMLElement | null>, handler: () => void) => {
    outsideClickContextsRef.current.delete({ outsideElementRef, handler });
  }, []);

  const handleOutsideClick = useCallback((event: MouseEvent) => {
    for (const ctx of outsideClickContextsRef.current) {
      if (ctx.outsideElementRef.current && !ctx.outsideElementRef.current.contains(event.target as Node)) {
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
    displayedModalId, isModalShowing, modalContent,
    confirmModal, infoModal, busyModal,
    handleModalConfirm, handleModalCancel, hideModals,
    registerOutsideClick, unregisterOutsideClick,
    cssVariables
  }), [
    activeTabId, setActiveTabId,
    displayedModalId, isModalShowing, modalContent,
    confirmModal, infoModal, busyModal,
    handleModalConfirm, handleModalCancel, hideModals,
    registerOutsideClick, unregisterOutsideClick,
    cssVariables
  ]);

  return (
    <ViewStateContext.Provider value={value}>
      { children }
    </ViewStateContext.Provider>
  );
};
