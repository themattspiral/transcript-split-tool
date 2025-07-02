import { useViewState } from 'context/view-state-context';

export const CONFIRM_MODAL_ID = 'confirm-modal';

export const ConfirmModal: React.FC = () => {
  const { modalContent, handleModalConfirm, handleModalCancel } = useViewState();

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
          className="px-4 py-2 rounded bg-gray-400 hover:bg-gray-500 text-white cursor-pointer"
          onClick={handleModalCancel}
        >
          Cancel
        </button>
        
        <button
          type="button"
          className="px-4 py-2 rounded bg-red-500 hover:bg-red-600 text-white cursor-pointer"
          onClick={handleModalConfirm}
        >
          Confirm
        </button>
      </div>
    </div>
  );
};
