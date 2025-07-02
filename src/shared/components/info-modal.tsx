import { useViewState } from 'context/view-state-context';

export const INFO_MODAL_ID = 'info-modal';

export const InfoModal: React.FC = () => {
  const { modalContent, handleModalConfirm } = useViewState();

  return (
    <div
      className="min-w-[400px] bg-white text-black rounded p-6 shadow-2xl flex flex-col gap-6"
      onClick={event => {
        event.stopPropagation();
      }}
    >
      <div>{ modalContent }</div>

      <div className="flex gap-4 justify-end">
        <button
          type="button"
          className="px-4 py-2 rounded bg-red-500 hover:bg-red-600 text-white cursor-pointer"
          onClick={handleModalConfirm}
        >
          OK
        </button>
      </div>
    </div>
  );
};
