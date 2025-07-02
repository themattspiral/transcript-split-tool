import { useViewState } from 'context/view-state-context';
import { CONFIRM_MODAL_ID, ConfirmModal } from './confirm-modal';
import { INFO_MODAL_ID, InfoModal } from './info-modal';
import { BUSY_MODAL_ID, BusyModal } from './busy-modal';

const ModalWindow: React.FC = () => {
  const { displayedModalId, isModalShowing } = useViewState();

  return (
    <div
      className="h-dvh w-dvw z-10 absolute top-0 bottom-0 right-0 left-0 content-center justify-center flex-wrap"
      style={isModalShowing ? { display: 'flex', backgroundColor: 'rgba(0, 0, 0, 0.4)' } : { display: 'none' }}
    >
      { displayedModalId === CONFIRM_MODAL_ID && <ConfirmModal /> }
      { displayedModalId === INFO_MODAL_ID && <InfoModal /> }
      { displayedModalId === BUSY_MODAL_ID && <BusyModal /> }
    </div>
  );
};

export { ModalWindow };
