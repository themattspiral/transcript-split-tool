import { useState } from 'react';

import {
  addNewLinePart, removeLinePart, updateLinePartGroup, removeLinePartsForGroup,
  TranscriptLine, LinePart
} from './data';
import { ControlBar } from './control-bar/ControlBar';
import { SplitGrid } from './split-grid/SplitGrid';
import { ModalWindow } from './modal/ModalWindow';
import { useViewState } from './ViewStateContext';

const App: React.FC = () => {
  const [transcriptLines, setTranscriptLines] = useState<TranscriptLine[]>([]);
  const { activeTabId } = useViewState();
  
  return (
    <div className="flex flex-col h-dvh w-dvw p-2 bg-gray-100 overflow-hidden">
      <ModalWindow />

      <ControlBar
        transcriptLines={transcriptLines}
        onTranscriptUploaded={setTranscriptLines}
      />
      
      {/* Active Tab Wrapper */}
      <div className="overflow-hidden grow-1 border-gray-300 border-15 rounded-t flex flex-col">

        {/* No Transcript Message */}
        {!transcriptLines?.length && activeTabId === 'transcript' &&
          <div className="flex flex-col grow-1 justify-center">
            <h1 className="flex justify-center text-2xl text-gray-600">
              Please import a transcript to get started.
            </h1>
          </div>
        }

        <SplitGrid
          style={activeTabId === 'transcript' ? {} : { display: 'none' }}
          transcriptLines={transcriptLines}
          onAddTextSelectionToNewGroup={(rowIdx: number, newlinePart: LinePart) => {
            setTranscriptLines(lines => addNewLinePart(lines, rowIdx, newlinePart));
          }}
          onAddTextSelectionToExistingGroup={(rowIdx: number, newlinePart: LinePart) => {
            setTranscriptLines(lines => addNewLinePart(lines, rowIdx, newlinePart));
          }}
          onRemoveTextSelectionFromGroup={(rowIdx: number, linePartIdx: number) => {
            setTranscriptLines(lines => removeLinePart(lines, rowIdx, linePartIdx));
          }}
          onUpdateTextSelectionGroup={(rowIdx: number, linePartIdx: number, newColumnId: string) => {
            setTranscriptLines(lines => updateLinePartGroup(lines, rowIdx, linePartIdx, newColumnId));
          }}
          onDeleteGroup={(columnId: string) => {
            setTranscriptLines(lines => removeLinePartsForGroup(lines, columnId));
          }}
        />

        { activeTabId === 'phrases' &&
          <div>Phrase Book!</div>
        }

        { activeTabId === 'poems' &&
          <div>Poems!</div>
        }

      </div>

    </div>
  );
};

export { App };
