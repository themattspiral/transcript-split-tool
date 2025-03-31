import { useViewState } from "../context/ViewStateContext";

const CONFIRM_MODAL_ID = 'confirm';

const ConfirmModal: React.FC = () => {
  const { modalMessage, modalOnConfirm, hideModals } = useViewState();

  return (
    <div
      className="min-w-[400px] bg-white text-black rounded p-6 shadow-2xl flex flex-col gap-6"
      onClick={event => {
        event.stopPropagation();
      }}
    >
      <span
        className=""
      >
        { modalMessage }
      </span>

      <div
        className="flex gap-4 justify-end"
      >
        <button
          className="px-4 py-2 rounded bg-gray-400 hover:bg-gray-500 text-white cursor-pointer"
          onClick={hideModals}
        >
          Cancel
        </button>
        
        <button
          className="px-4 py-2 rounded bg-red-500 hover:bg-red-600 text-white cursor-pointer"
          onClick={() => {
            if (modalOnConfirm) {
              modalOnConfirm();
            }
            hideModals();
          }}
        >
          Confirm
        </button>
      </div>
    </div>
  );
};

export { ConfirmModal, CONFIRM_MODAL_ID };
