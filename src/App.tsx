import { ModalWindow } from './modal/ModalWindow';
import { ControlBar } from './control-bar/ControlBar';
import { TranscriptGrid } from './transcript-grid/TranscriptGrid';
import { PhraseGrid } from './phrase-grid/PhraseGrid';
import { useViewState } from './context/view-state-context';
import { TabId } from './data/data';

const App: React.FC = () => {
  const { activeTabId } = useViewState();

  return (
    <div className="flex flex-col h-dvh w-dvw p-2 overflow-hidden">
      <ModalWindow />

      <ControlBar />
      
      {/* Active Tab Wrapper */}
      <div className="overflow-hidden grow-1 border-gray-300 border-8 rounded-t flex flex-col shadow-md shadow-gray-400">

        <TranscriptGrid
          style={activeTabId === TabId.Transcript ? {} : { display: 'none' }}
        />

        <PhraseGrid
          style={activeTabId === TabId.Structures ? {} : { display: 'none' }}
        />

      </div>

    </div>
  );
};

export { App };
