
import { ReactNode, RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { CONFIRM_MODAL_ID } from 'components/confirm-modal';
import { INFO_MODAL_ID } from 'components/info-modal';
import { BUSY_MODAL_ID } from 'components/busy-modal';
import { CustomCSSVariables, ViewStateContext } from './view-state-context';

interface OutsideClickContext {
  outsideElementRef: RefObject<HTMLElement | null>,
  handler: () => void;
}

export const ViewStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [displayedModalId, setDisplayedModalId] = useState<string | null>(null);
  const [isModalCancellable, setIsModalCancellable] = useState<boolean>(false);
  const isModalShowing = !!displayedModalId;
  const [modalContent, setModalContent] = useState<ReactNode | null>(null);
  const outsideClickContextsRef = useRef<Set<OutsideClickContext>>(new Set());

  const modalResolve = useRef<() => void | null>(null);
  const modalReject = useRef<() => void | null>(null);

  const hideModals = useCallback(() => {
    setDisplayedModalId(null);
    setModalContent(null);
    setIsModalCancellable(false);
    modalResolve.current = null;
    modalReject.current = null;
  }, [setDisplayedModalId, setModalContent, setIsModalCancellable, modalResolve, modalReject]);

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
      setIsModalCancellable(true);
      setDisplayedModalId(CONFIRM_MODAL_ID);
      modalResolve.current = resolve;
      modalReject.current = reject;
    });
  }, [setDisplayedModalId, setModalContent, setIsModalCancellable, modalResolve, modalReject]);

  const infoModal = useCallback(async (content: ReactNode): Promise<void> => {
    return new Promise<void>((resolve, _reject) => {
      setModalContent(content);
      setIsModalCancellable(true);
      setDisplayedModalId(INFO_MODAL_ID);
      modalResolve.current = resolve;
    });
  }, [setDisplayedModalId, setModalContent, setIsModalCancellable, modalResolve]);

  const busyModal = useCallback((content: ReactNode, cancellable: boolean = false) => {
    setModalContent(content);
    setIsModalCancellable(cancellable);
    setDisplayedModalId(BUSY_MODAL_ID);
  }, [setDisplayedModalId, setModalContent, setIsModalCancellable]);

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
    displayedModalId, isModalCancellable, isModalShowing, modalContent,
    confirmModal, infoModal, busyModal,
    handleModalConfirm, handleModalCancel, hideModals,
    registerOutsideClick, unregisterOutsideClick,
    cssVariables
  }), [
    displayedModalId, isModalCancellable, isModalShowing, modalContent,
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
