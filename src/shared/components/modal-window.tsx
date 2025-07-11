import { CSSProperties, useMemo } from 'react';

import { useViewState } from 'context/view-state-context';
import { CONFIRM_MODAL_ID, ConfirmModal } from './confirm-modal';
import { INFO_MODAL_ID, InfoModal } from './info-modal';
import { BUSY_MODAL_ID, BusyModal } from './busy-modal';

const TRANSITION_TIME = '0.15s';

const ModalWindow: React.FC = () => {
  const { displayedModalId, isModalShowing, isModalCancellable, hideModals } = useViewState();

  const styles: CSSProperties = useMemo(() => ({
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    opacity: isModalShowing ? 1 : 0,
    visibility: isModalShowing ? 'visible' : 'hidden',
    transition: `opacity ${TRANSITION_TIME} ease-in-out, visibility ${TRANSITION_TIME}`
  }), [isModalShowing]);

  const clickHandler = useMemo(() => isModalCancellable ? hideModals : undefined, [isModalCancellable]);

  return (
    <div
      className="h-dvh w-dvw z-10 absolute top-0 bottom-0 right-0 left-0 content-center justify-center flex flex-wrap"
      style={styles}
      onClick={clickHandler}
    >
      { displayedModalId === CONFIRM_MODAL_ID && <ConfirmModal /> }
      { displayedModalId === INFO_MODAL_ID && <InfoModal /> }
      { displayedModalId === BUSY_MODAL_ID && <BusyModal /> }
    </div>
  );
};

export { ModalWindow };
