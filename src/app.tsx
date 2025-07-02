import { TabId } from 'data';
import { ModalWindow } from 'components/modal-window';
import { useViewState } from 'context/view-state-context';
import { ControlBar } from './control-bar/control-bar';
import { StructuresGrid } from './structures-view/structures-grid';
import { TranscriptView } from './transcript-view/transcript-view';

export const App: React.FC = () => {
  const { activeTabId } = useViewState();

  return (
    <div className="flex flex-col h-dvh w-dvw p-2 overflow-hidden">
      <ModalWindow />

      <ControlBar />
      
      {/* Active Tab Wrapper */}
      <div className="overflow-hidden grow-1 border-gray-300 border-8 rounded-t flex flex-col shadow-md shadow-gray-400">

        <TranscriptView
          className='grow-1 w-full'
          style={activeTabId === TabId.Transcript ? {} : { display: 'none' }}
        />

        <StructuresGrid style={activeTabId === TabId.Structures ? {} : { display: 'none' }} />

      </div>

    </div>
  );
};
