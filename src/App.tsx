import { TABS } from './data';
import { ControlBar } from './control-bar/ControlBar';
import { TranscriptGrid } from './transcript-grid/TranscriptGrid';
import { ModalWindow } from './modal/ModalWindow';
import { useViewState } from './ViewStateContext';
import { PhraseGrid } from './phrase-grid/PhraseGrid';

const App: React.FC = () => {
  const { activeTabId, transcriptLines, phraseRepetitions } = useViewState();

  return (
    <div className="flex flex-col h-dvh w-dvw p-2 overflow-hidden">
      <ModalWindow />

      <ControlBar />
      
      {/* Active Tab Wrapper */}
      <div className="overflow-hidden grow-1 border-gray-300 border-8 rounded-t flex flex-col shadow-md shadow-gray-400">

        {!transcriptLines?.length && activeTabId === TABS.Transcript &&
          <div className="flex flex-col grow-1 justify-center">
            <h1 className="flex justify-center text-2xl text-gray-600">
              Please import a transcript to get started.
            </h1>
          </div>
        }

        <TranscriptGrid
          style={activeTabId === TABS.Transcript ? {} : { display: 'none' }}
        />

        {!phraseRepetitions?.length && activeTabId === TABS.PhraseBook &&
          <div className="flex flex-col grow-1 justify-center">
            <h1 className="flex justify-center text-2xl text-gray-600 mb-4">
              No phrase repetitions defined yet.
            </h1>
            <h1 className="flex justify-center text-2xl text-gray-600">
              Highlight text within a transcript to get started.
            </h1>
          </div>
        }

        <PhraseGrid
          style={activeTabId === TABS.PhraseBook ? {} : { display: 'none' }}
          transcriptLines={transcriptLines}
          phraseRepetitions={phraseRepetitions}
        />
          

        {!transcriptLines?.length && activeTabId === TABS.Poems &&
          <div className="flex flex-col grow-1 justify-center">
            <h1 className="flex justify-center text-2xl text-gray-600">
              No poems defined yet.
            </h1>
          </div>
        }

      </div>

    </div>
  );
};

export { App };
