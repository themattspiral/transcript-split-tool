import { useState, CSSProperties, useMemo } from 'react';
import { useContextMenu } from "react-contexify";

import { GridAction, Phrase, TranscriptGridColumnId, HEADER_ROW_ID } from '../data/data';
import { getPhraseText, getGridColumnAttributes, getSelectionRangeContainerAttribute } from '../util/util';
import { useViewState } from '../ViewStateContext';
import { TRANSCRIPT_SELECTION_MENU_ID, TranscriptSelectionMenu } from '../context-menu/TranscriptSelectionMenu';
import { ERROR_MULTIPLE_LINES_MENU_ID, ErrorMultipleLinesMenu } from '../context-menu/ErrorMultipleLinesMenu';
import { HighlightableTextCell } from './HighlightableTextCell';

interface TranscriptGridProps {
  style?: CSSProperties | undefined;
}

const TranscriptGrid: React.FC<TranscriptGridProps> = ({ style }) => {
  const [gridAction, setGridAction] = useState<GridAction | null>(null);
  
  const { show: showContextMenu } = useContextMenu();
  const {
    transcriptLines, phraseRepetitions, pendingPhrase, pendingRepeatedPhrase,
    setPendingPhrase, setPendingRepeatedPhrase
  } = useViewState();

  const phrasesByTranscriptLineIdx: { [key: string]: Phrase[] } = useMemo(() => {
    const reps: { [key: string]: Phrase[] } = {};

    phraseRepetitions.forEach(rep => {
      const linePhrases = reps[rep.phrase.transcriptLineIdx] || [];
      reps[rep.phrase.transcriptLineIdx] = linePhrases.concat(rep.phrase);
      
      const repeatedLinePhrases = reps[rep.repetionOf.transcriptLineIdx] || [];
      reps[rep.repetionOf.transcriptLineIdx] = repeatedLinePhrases.concat(rep.repetionOf);
    });

    if (pendingPhrase) {
      const linePhrases = reps[pendingPhrase.transcriptLineIdx] || [];
      reps[pendingPhrase.transcriptLineIdx] = linePhrases.concat(pendingPhrase);
    }
    
    if (pendingRepeatedPhrase) {
      const linePhrases = reps[pendingRepeatedPhrase.transcriptLineIdx] || [];
      reps[pendingRepeatedPhrase.transcriptLineIdx] = linePhrases.concat(pendingRepeatedPhrase);
    }

    return reps;
  }, [phraseRepetitions, pendingPhrase, pendingRepeatedPhrase]);
  

  const handleSetNewPhrase = () => {
    if (gridAction?.selectedPhrase) {
      setPendingPhrase({ ...gridAction.selectedPhrase, isRepetition: false });
      gridAction?.textSelection?.empty();
      setGridAction(null);
    }
  };

  const handleSetRepeatedPhrase = () => {
    if (gridAction?.selectedPhrase) {
      setPendingRepeatedPhrase({ ...gridAction.selectedPhrase, isRepetition: true });
      gridAction?.textSelection?.empty();
      setGridAction(null);
    }
  };

  const handleGridAction = (event: React.MouseEvent, handleAsPrimaryClick: boolean): void => {
    if (handleAsPrimaryClick && (event.button != 0 || !pendingPhrase)) {
      return;
    }

    const gridAttrs: NamedNodeMap | undefined = getGridColumnAttributes(event);

    if (!gridAttrs) {
      console.error('Couldnt get attributes from target or immediate parents. Event:', event);
      return;
    }

    const transcriptLineIdxString = gridAttrs.getNamedItem('data-transcript-line-idx')?.value;
    const columnIdString = gridAttrs.getNamedItem('data-column-id')?.value;
    const transcriptLineIdx = parseInt(transcriptLineIdxString || '');
    
    const sel = document.getSelection();
    const selText = sel?.toString();
    const range = sel?.getRangeAt(0);
    
    const beginPhraseLineStartIdxString = getSelectionRangeContainerAttribute(range?.startContainer, 'data-pls-idx');
    const endPhraseLineStartIdxString = getSelectionRangeContainerAttribute(range?.endContainer, 'data-pls-idx');
    const beginPhraseLineStartIdx = parseInt(beginPhraseLineStartIdxString || '0');
    const endPhraseLineStartIdx = parseInt(endPhraseLineStartIdxString || '0');
    
    const isHeaderRow: boolean = transcriptLineIdxString === 'header';
    const isTextColumn: boolean = columnIdString === 'text';
    const hasSelection: boolean = !!selText;
    const hasMultiLineSelection: boolean = selText?.includes('\n') || false;

    if (!columnIdString) {
      console.error('Couldnt determine column. Event:', event);
      return;
    }

    if (hasMultiLineSelection) {
      if (event.preventDefault) event.preventDefault();
      showContextMenu({ id: ERROR_MULTIPLE_LINES_MENU_ID, event });
    } else if (!isHeaderRow && isTextColumn && hasSelection && range) {
      if (event.preventDefault) event.preventDefault();
      setGridAction({
        columnId: columnIdString,
        transcriptLineIdx,
        selectedPhrase: {
          transcriptLineIdx,
          start: (range.startOffset + beginPhraseLineStartIdx) || 0,
          end: (range.endOffset + endPhraseLineStartIdx) || 0,
          isRepetition: !!pendingPhrase,
          isPending: true
        },
        textSelection: sel || undefined
      });
      showContextMenu({ event, id: TRANSCRIPT_SELECTION_MENU_ID });
    }
  };

  return !transcriptLines?.length ? null : (
    <div
      className="flex flex-col overflow-auto box-border w-full font-mono"
      onClick={event => handleGridAction(event, true)}
      onContextMenu={event => handleGridAction(event, false)}
      style={style}
    >
      <TranscriptSelectionMenu
        textSelectionString={getPhraseText(gridAction?.selectedPhrase, transcriptLines)}
        onSetPhrase={handleSetNewPhrase}
        onSetRepeatedPhrase={handleSetRepeatedPhrase}
      />

      <ErrorMultipleLinesMenu />
      
      {/* Header Row */}
      <div
        className="flex font-medium font-sans sticky top-0 z-5 bg-gray-200 shadow-sm shadow-gray-400 select-none"
        data-transcript-line-idx={HEADER_ROW_ID}
      >

        <div
          className="px-2 py-2 border-b-1 border-gray-400 flex justify-end basis-[60px] shrink-0"
          data-column data-column-id={TranscriptGridColumnId.Line} data-transcript-line-idx={HEADER_ROW_ID}
        >
          Line
        </div>
        <div
          className="px-2 py-2 border-b-1 border-gray-400 basis-[100px] shrink-0"
          data-column data-column-id={TranscriptGridColumnId.Speaker} data-transcript-line-idx={HEADER_ROW_ID}
        >
          Speaker
        </div>
        <div
          className="px-2 py-2 border-b-1 border-gray-400 grow-1"
          data-column data-column-id={TranscriptGridColumnId.Text} data-transcript-line-idx={HEADER_ROW_ID}
        >
          Transcript Text
        </div>

      </div>

      {/* Data Rows */}
      { transcriptLines.map((line, idx) => (
        <div className="flex" key={line.lineNumber} data-transcript-line-idx={idx}>

          <div
            className="px-2 py-2 border-b-1 border-gray-400 flex justify-end basis-[60px] shrink-0 text-ellipsis overflow-hidden"
            data-column data-column-id={TranscriptGridColumnId.Line} data-transcript-line-idx={idx}
          >
            {line.lineNumber}
          </div>

          <div
            className="px-2 py-2 border-b-1 border-gray-400 basis-[100px] shrink-0"
            data-column data-column-id={TranscriptGridColumnId.Speaker} data-transcript-line-idx={idx}
          >
            { line.speaker }
          </div>

          <HighlightableTextCell
            line={line}
            phrases={phrasesByTranscriptLineIdx[idx]}
            className="border-b-1 border-gray-400 grow-1"
            attributes={{
              ['data-column']: 'true',
              ['data-column-id']: TranscriptGridColumnId.Text,
              ['data-transcript-line-idx']: idx
            }}
          />

        </div>
      ))}

    </div>
  );
};

export { TranscriptGrid };
