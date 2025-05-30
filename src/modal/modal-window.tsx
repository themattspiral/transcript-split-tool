import { useViewState } from '../context/view-state-context';
import { ConfirmModal, CONFIRM_MODAL_ID } from './confirm-modal';

const ModalWindow: React.FC = () => {
  const { displayedModalId, isModalShowing, hideModals } = useViewState();

  return (
    <div
      className="h-dvh w-dvw z-10 absolute top-0 bottom-0 right-0 left-0 content-center justify-center flex-wrap"
      style={isModalShowing ? { display: 'flex', backgroundColor: 'rgba(0, 0, 0, 0.4)' } : { display: 'none' }}
      onClick={hideModals}
    >
      { displayedModalId === CONFIRM_MODAL_ID && <ConfirmModal /> }
    </div>
  );
};

export { ModalWindow };
