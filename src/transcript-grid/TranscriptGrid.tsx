import { useState, CSSProperties, useMemo } from 'react';
import { useContextMenu } from "react-contexify";
import classnames from 'classnames';

import { getPhraseText, GridAction, Phrase } from '../data';
import { getGridColumnAttributes } from '../util';
import { useViewState } from '../ViewStateContext';
import { NEW_PHRASE_MENU_ID, NewPhraseMenu } from '../context-menu/NewPhraseMenu';
import { REPEATED_PHRASE_MENU_ID, RepeatedPhraseMenu } from '../context-menu/RepeatedPhraseMenu';
import { ERROR_MULTIPLE_LINES_MENU_ID, ErrorMultipleLinesMenu } from '../context-menu/ErrorMultipleLinesMenu';
import { SplitterTextCell } from './SplitterTextCell';

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
      setPendingPhrase(gridAction.selectedPhrase);
      gridAction?.textSelection?.empty();
      setGridAction(null);
    }
  };

  const handleSetRepeatedPhrase = () => {
    if (gridAction?.selectedPhrase) {
      setPendingRepeatedPhrase(gridAction.selectedPhrase);
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
    
    const beginPhraseLineStartIdxString = range?.startContainer.parentElement?.attributes?.getNamedItem('data-pls-idx')?.value;
    const endPhraseLineStartIdxString = range?.endContainer.parentElement?.attributes?.getNamedItem('data-pls-idx')?.value;
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

    if (isHeaderRow) {
      console.log('header');
    } else if (hasMultiLineSelection) {
      if (event.preventDefault) event.preventDefault();
      showContextMenu({ id: ERROR_MULTIPLE_LINES_MENU_ID, event });
    } else if (hasSelection && range && isTextColumn) {
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
      showContextMenu({
        event,
        id: pendingPhrase || handleAsPrimaryClick ? REPEATED_PHRASE_MENU_ID : NEW_PHRASE_MENU_ID
      });
    } else {
      console.log('data row, no selection');
    }
  };

  return !transcriptLines?.length ? null : (
    <div
      className="flex flex-col overflow-auto box-border w-full"
      onClick={event => handleGridAction(event, true)}
      onContextMenu={event => handleGridAction(event, false)}
      style={style}
    >
      <NewPhraseMenu
        textSelectionString={getPhraseText(gridAction?.selectedPhrase, transcriptLines)}
        onSetPhrase={handleSetNewPhrase}
      />

      <RepeatedPhraseMenu
        textSelectionString={getPhraseText(gridAction?.selectedPhrase, transcriptLines)}
        onSetPhrase={handleSetRepeatedPhrase}
      />

      <ErrorMultipleLinesMenu />
      
      {/* Header Row */}
      <div
        className="flex font-medium sticky top-0 z-3 bg-gray-200 shadow-sm shadow-gray-400 select-none"
        data-transcript-line-idx="header"
      >

        <div
          className="px-2 py-2 border-r-0 border-b-1 border-gray-400 flex justify-end basis-[60px] shrink-0"
          data-column data-column-id="line" data-transcript-line-idx="header"
        >
          Line
        </div>
        <div
          className="px-2 py-2 border-r-0 border-b-1 border-gray-400 basis-[100px] shrink-0"
          data-column data-column-id="speaker" data-transcript-line-idx="header"
        >
          Speaker
        </div>
        <div
          className="px-2 py-2 border-r-0 border-b-1 border-gray-400 grow-1"
          data-column data-column-id="text" data-transcript-line-idx="header"
        >
          Transcript Text
        </div>

      </div>

      {/* Data Rows */}
      {transcriptLines.map((line, idx) => {
        const maskedRowClasses = pendingPhrase && idx > pendingPhrase.transcriptLineIdx
          ? 'bg-gray-200 text-gray-400 select-none cursor-not-allowed' : '';

        const maskedTextIdx = pendingPhrase && idx === pendingPhrase.transcriptLineIdx
          ? pendingPhrase.start : undefined;
        
        return (
          <div 
            key={line.lineNumber}
            className={classnames('flex font-mono', maskedRowClasses)}
            data-transcript-line-idx={idx}
          >

            <div
              className="px-2 py-2 border-r-0 border-b-1 border-gray-400 flex justify-end basis-[60px] shrink-0 text-ellipsis overflow-hidden"
              data-column data-column-id="line" data-transcript-line-idx={idx}
            >
              {line.lineNumber}
            </div>
            <div
              className="px-2 py-2 border-r-0 border-b-1 border-gray-400 basis-[100px] shrink-0"
              data-column data-column-id="speaker" data-transcript-line-idx={idx}
            >
              { line.speaker }
            </div>
            <SplitterTextCell
              line={line}
              phrases={phrasesByTranscriptLineIdx[idx]}
              maskIdx={maskedTextIdx}
              className="border-r-0 border-b-1 border-gray-400 grow-1"
              attributes={{ ['data-column']: 'true', ['data-column-id']: 'text', ['data-transcript-line-idx']: idx.toString() }}
            />

          </div>
        );
      })}

    </div>
  );
};

export { TranscriptGrid };
