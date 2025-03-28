import { useState, CSSProperties, useMemo, useCallback } from 'react';
import { useContextMenu } from "react-contexify";
import classnames from 'classnames';

import { Phrase, HEADER_ROW_ID } from '../data/data';
import { getGridColumnAttributes, getSelectionRangeContainerAttribute } from '../util/util';
import { useViewState } from '../ViewStateContext';
import { TRANSCRIPT_SELECTION_MENU_ID } from '../context-menu/TranscriptSelectionMenu';
import { ERROR_MULTIPLE_LINES_MENU_ID } from '../context-menu/ErrorMultipleLinesMenu';
import { HighlightableTextCell } from './HighlightableTextCell';

export enum TranscriptGridColumnId {
  Line = 'line',
  Speaker = 'speaker',
  Text = 'text'
}

interface TranscriptGridProps {
  style?: CSSProperties | undefined;
}

const TranscriptGrid: React.FC<TranscriptGridProps> = ({ style }) => {
  const [hoveredRowIdx, setHoveredRowIdx] = useState<number | null>(null);
  
  const { show: showContextMenu } = useContextMenu();
  const {
    transcriptLines, phraseRepetitions, pendingPhrase, pendingRepeatedPhrase,
    setContextPhrase, setClickedPhraseKeys
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

  const handleGridAction = useCallback((event: React.MouseEvent, handleAsPrimaryClick: boolean): void => {
    // using handler for onClick event, button was right click
    if (handleAsPrimaryClick && event.button != 0) {
      setClickedPhraseKeys(new Set());
      return;
    }

    // using handler for onClick, nothing being set/edited
    if (handleAsPrimaryClick && event.button === 0 && !pendingPhrase && !pendingRepeatedPhrase) {
      setClickedPhraseKeys(new Set());
      return;
    }

    const sel = document.getSelection();
    const selText = sel?.toString();
    const range = sel?.getRangeAt(0);

    // using handler for onContextMenu, but no selection is present
    if (!handleAsPrimaryClick && (!sel || !selText || !range)) {
      setClickedPhraseKeys(new Set());
      return;
    }

    const gridAttrs: NamedNodeMap | undefined = getGridColumnAttributes(event);
    if (!gridAttrs) {
      console.error('Couldnt get attributes from target or immediate parents. Event:', event);
      return;
    }

    const columnIdString = gridAttrs.getNamedItem('data-column-id')?.value;
    if (!columnIdString) {
      console.error('Couldnt determine column. Event:', event);
      return;
    }

    const transcriptLineIdxString = gridAttrs.getNamedItem('data-transcript-line-idx')?.value;
    const transcriptLineIdx = parseInt(transcriptLineIdxString || '');
    
    const beginPhraseLineStartIdxString = getSelectionRangeContainerAttribute(range?.startContainer, 'data-pls-idx');
    const endPhraseLineStartIdxString = getSelectionRangeContainerAttribute(range?.endContainer, 'data-pls-idx');
    const beginPhraseLineStartIdx = parseInt(beginPhraseLineStartIdxString || '0');
    const endPhraseLineStartIdx = parseInt(endPhraseLineStartIdxString || '0');
    
    const isHeaderRow: boolean = transcriptLineIdxString === HEADER_ROW_ID;
    const isTextColumn: boolean = columnIdString === TranscriptGridColumnId.Text;
    const hasSelection: boolean = !!selText;
    const hasMultiLineSelection: boolean = selText?.includes('\n') || false;

    if (hasMultiLineSelection) {
      if (event.preventDefault) event.preventDefault();
      showContextMenu({ id: ERROR_MULTIPLE_LINES_MENU_ID, event });
    } else if (!isHeaderRow && isTextColumn && hasSelection && range) {
      if (event.preventDefault) event.preventDefault();
      setContextPhrase({
        transcriptLineIdx,
        start: (range.startOffset + beginPhraseLineStartIdx) || 0,
        end: (range.endOffset + endPhraseLineStartIdx) || 0,
        isRepetition: !!pendingPhrase,
        isPending: true
      });
      showContextMenu({ event, id: TRANSCRIPT_SELECTION_MENU_ID });
    }
  }, [setClickedPhraseKeys, pendingPhrase, pendingRepeatedPhrase]);

  const headerRow = useMemo(() => (
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
  ), []);

  const dataRows = useMemo(() => (
    <>
    { transcriptLines.map((line, idx) => (
        <div
          key={line.lineNumber}
          data-transcript-line-idx={idx}
          className={classnames('flex', { ['bg-gray-100']: hoveredRowIdx === idx })}
          onMouseOver={() => setHoveredRowIdx(idx)}
          onMouseOut={() => setHoveredRowIdx(null)}
        >

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
            linePhrases={phrasesByTranscriptLineIdx[idx]}
            className="border-b-1 border-gray-400 grow-1"
            attributes={{
              ['data-column']: 'true',
              ['data-column-id']: TranscriptGridColumnId.Text,
              ['data-transcript-line-idx']: idx
            }}
          />

        </div>
      )) }
    </>
  ), [transcriptLines, hoveredRowIdx, setHoveredRowIdx, phrasesByTranscriptLineIdx]);

  return transcriptLines?.length ? (
    <div
      className="flex flex-col overflow-auto box-border w-full font-mono"
      onClick={event => handleGridAction(event, true)}
      onContextMenu={event => handleGridAction(event, false)}
      style={style}
    >
      
      { headerRow }

      { dataRows }

    </div>
  ) : null;
};

export { TranscriptGrid };
