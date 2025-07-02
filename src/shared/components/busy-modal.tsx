import { useViewState } from 'context/view-state-context';

export const BUSY_MODAL_ID = 'busy-modal';

export const BusyModal: React.FC = () => {
  const { modalContent } = useViewState();

  return (
    <div
      className="min-w-[400px] bg-white text-black rounded p-6 shadow-2xl flex flex-col gap-6"
      onClick={event => {
        event.stopPropagation();
      }}
    >
      <div>{ modalContent }</div>

    </div>
  );
};
