import { Outlet } from 'react-router-dom';

import { ModalWindow } from 'components/modal-window';
import { ControlBar } from './control-bar/control-bar';

export const App: React.FC = () => {
  return (
    <div className="flex flex-col h-dvh w-dvw p-2 overflow-hidden">
      <ModalWindow />

      <ControlBar />
      
      <div className="overflow-hidden grow-1 border-gray-300 border-8 rounded-t flex flex-col shadow-md shadow-gray-400">

        {/* will be routed to either TranscriptView or StructuresView */}
        <Outlet />

      </div>

    </div>
  );
};
