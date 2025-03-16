import { useState } from 'react';

import {
  addNewLinePart, removeLinePart, updateLinePartGroup, removeLinePartsForGroup,
  TranscriptLine, LinePart
} from './data';
import { ControlBar } from './control-bar/ControlBar';
import { SplitGrid } from './split-grid/SplitGrid';
import { ModalWindow } from './modal/ModalWindow';

const App: React.FC = () => {
  const [transcriptLines, setTranscriptLines] = useState<TranscriptLine[]>([]);
  
  return (
    <div className="flex flex-col h-dvh w-dvw p-5 bg-gray-100 overflow-hidden">
      <ModalWindow />

      <ControlBar
        transcriptLines={transcriptLines}
        onTranscriptUploaded={setTranscriptLines}
      />
      
      {/* No Transcript Message */}
      {!transcriptLines?.length &&
        <h1 className="text-2xl mt-2">
          Please import a transcript to get started.
        </h1>
      }

      <SplitGrid
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

    </div>
  );
};

export { App };
