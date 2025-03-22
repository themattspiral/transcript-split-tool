import { useState, CSSProperties, useMemo } from 'react';
import { useContextMenu } from "react-contexify";
import classnames from 'classnames';

import { GridClickState, Phrase, byStart } from '../data';
import { getGridColumnAttributes } from '../util';
import { useViewState } from '../ViewStateContext';
import { NEW_PHRASE_MENU_ID, NewPhraseMenu } from '../context-menu/NewPhraseMenu';
import { REPEATED_PHRASE_MENU_ID, RepeatedPhraseMenu } from '../context-menu/RepeatedPhraseMenu';
import { ERROR_MULTIPLE_LINES_MENU_ID, ErrorMultipleLinesMenu } from '../context-menu/ErrorMultipleLinesMenu';
import SplitterTextCell from './SplitterTextCell';

interface TranscriptGridProps {
  style?: CSSProperties | undefined;
}

const TranscriptGrid: React.FC<TranscriptGridProps> = ({ style }) => {
  const [gridClickState, setGridClickState] = useState<GridClickState | null>(null);
  
  const { show: showContextMenu } = useContextMenu();
  const {
    transcriptLines, phraseRepetitions, pendingPhraseRepetition,
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

    Object.values(reps).forEach(phrases => {
      phrases.sort(byStart);
    });

    return reps;
  }, [phraseRepetitions]);
  

  const handleSetNewPhrase = () => {
    if (!Number.isInteger(gridClickState?.transcriptLineIdx)
      || !gridClickState?.textSelection
      || !gridClickState?.textSelectionString
    ) {
      return;
    }

    const transcriptLineIdx = gridClickState?.transcriptLineIdx as number;
    const range = gridClickState.textSelection.getRangeAt(0);
  
    if (transcriptLineIdx >= 0) {
      setPendingPhrase({
        transcriptLineIdx,
        start: range?.startOffset || -1,
        end: range?.endOffset || -1,
        isRepetition: false
      });

      gridClickState?.textSelection?.empty();
      setGridClickState(null);
    };
  };

  const handleSetRepeatedPhrase = () => {
    if (!Number.isInteger(gridClickState?.transcriptLineIdx)
      || !gridClickState?.textSelection
      || !gridClickState?.textSelectionString
    ) {
      return;
    }

    const transcriptLineIdx = gridClickState?.transcriptLineIdx as number;
    const range = gridClickState.textSelection.getRangeAt(0);
  
    if (transcriptLineIdx >= 0) {
      setPendingRepeatedPhrase({
        transcriptLineIdx,
        start: range?.startOffset || -1,
        end: range?.endOffset || -1,
        isRepetition: true
      });

      gridClickState?.textSelection?.empty();
      setGridClickState(null);
    };
  };

  const handleGridContextMenu = (event: React.MouseEvent): void => {    
    let attrs: NamedNodeMap | undefined = getGridColumnAttributes(event);
    if (!attrs) {
      console.error('Couldnt get attributes from target or immediate parents. Event:', event);
      return;
    }

    const transcriptLineIdxString = attrs.getNamedItem('data-transcript-line-idx')?.value;
    const columnIdString = attrs.getNamedItem('data-column-id')?.value;
    const sel = document.getSelection();
    const selText = sel?.toString();
    
    const isHeaderRow = transcriptLineIdxString === 'header';
    const transcriptLineIdx = parseInt(transcriptLineIdxString || '');
    const isTextColumn = columnIdString === 'text';
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
    } else if (hasSelection && isTextColumn) {
      if (event.preventDefault) event.preventDefault();
      setGridClickState({
        columnId: columnIdString || '?',
        transcriptLineIdx,
        textSelection: sel,
        textSelectionString: selText
      });
      showContextMenu({
        event,
        id: pendingPhraseRepetition ? REPEATED_PHRASE_MENU_ID : NEW_PHRASE_MENU_ID
      });
    } else {
      console.log('data row, no selection');
    }
  };

  const handleGridClick = (event: React.MouseEvent): void => {
    // only handle primary button (secondary handled by onConextMenu)
    if (event.button === 0 && pendingPhraseRepetition) {
      let attrs: NamedNodeMap | undefined = getGridColumnAttributes(event);
      if (!attrs) {
        console.error('Couldnt get attributes from target or immediate parents. Event:', event);
        return;
      }
  
      const transcriptLineIdxString = attrs.getNamedItem('data-transcript-line-idx')?.value;
      const columnIdString = attrs.getNamedItem('data-column-id')?.value;
      const sel = document.getSelection();
      const selText = sel?.toString();
      
      const isHeaderRow = transcriptLineIdxString === 'header';
      const transcriptLineIdx = parseInt(transcriptLineIdxString || '');
      const isTextColumn = columnIdString === 'text';
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
        event.stopPropagation();
        showContextMenu({ id: ERROR_MULTIPLE_LINES_MENU_ID, event });
      } else if (hasSelection && isTextColumn) {
        if (event.preventDefault) event.preventDefault();
        setGridClickState({
          columnId: columnIdString || '?',
          transcriptLineIdx,
          textSelection: sel,
          textSelectionString: selText
        });
        showContextMenu({ id: REPEATED_PHRASE_MENU_ID, event });
      } else {
        console.log('data row, no selection');
      }
    }
  };

  return !transcriptLines?.length ? null : (
    <div
      className="flex flex-col overflow-auto box-border w-full"
      onContextMenu={handleGridContextMenu}
      onClick={handleGridClick}
      style={style}
    >
      <NewPhraseMenu
        textSelectionString={gridClickState?.textSelectionString || ''}
        onSetPhrase={handleSetNewPhrase}
      />

      <RepeatedPhraseMenu
        textSelectionString={gridClickState?.textSelectionString || ''}
        onSetPhrase={handleSetRepeatedPhrase}
      />

      <ErrorMultipleLinesMenu />
      
      {/* Header Row */}
      <div
        className="flex font-medium sticky top-0 bg-gray-200 shadow-sm shadow-gray-400 select-none"
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
        const maskedRowClasses = pendingPhraseRepetition && idx > pendingPhraseRepetition.phrase.transcriptLineIdx
          ? 'bg-gray-200 text-gray-400 select-none cursor-not-allowed' : '';

        const maskedTextIdx = pendingPhraseRepetition && idx === pendingPhraseRepetition.phrase.transcriptLineIdx
          ? pendingPhraseRepetition.phrase.start : null;
        
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
