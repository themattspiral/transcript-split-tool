import { useState, useMemo, CSSProperties } from 'react';
import { useContextMenu } from "react-contexify";

import { getPhraseRepetitionKey, GridClickState, PhraseRepetition, TranscriptLine } from '../data';
import { useViewState } from '../ViewStateContext';
import { SPLIT_MENU_ID, SplitTextMenu } from '../context-menu/SplitTextMenu';
import { ERROR_MULTIPLE_LINES_MENU_ID, ErrorMultipleLinesMenu } from '../context-menu/ErrorMultipleLinesMenu';

interface PhraseGridProps {
  transcriptLines: TranscriptLine[];
  phraseRepetitions: PhraseRepetition[];
  style?: CSSProperties | undefined;
}

const PhraseGrid: React.FC<PhraseGridProps> = props => {
  const { transcriptLines, phraseRepetitions, style } = props;
  const [gridClickState, setGridClickState] = useState<GridClickState | null>(null);
  const { show: showContextMenu } = useContextMenu();
  const { showConfirmationModal } = useViewState();

  const handleAddSelectionToNewGroup = () => {
    if (!Number.isInteger(gridClickState?.transcriptLineIdx)
      || !gridClickState?.textSelection
      || !gridClickState?.textSelectionString
    ) {
      return;
    }

    const rowIdx = gridClickState?.transcriptLineIdx as number;
    const range = gridClickState.textSelection.getRangeAt(0);
  
    if (rowIdx >= 0) {
      // const columnId = addColumn();

      // onAddTextSelectionToNewGroup(rowIdx, {
      //   columnId,
      //   start: range?.startOffset || -1,
      //   end: range?.endOffset || -1,
      //   text: gridClickState.textSelectionString || ''
      // });

      gridClickState?.textSelection?.empty();
      setGridClickState(null);
    };
  };

  const handleAddSelectionToExistingGroup = (columnId: string) => {
    if (!Number.isInteger(gridClickState?.transcriptLineIdx)
      || !gridClickState?.textSelection
      || !gridClickState?.textSelectionString
    ) {
      return;
    }

    const rowIdx = gridClickState?.transcriptLineIdx as number;
    const range = gridClickState.textSelection.getRangeAt(0);
  
    if (rowIdx >= 0) {
      // onAddTextSelectionToExistingGroup(rowIdx, {
      //   columnId,
      //   start: range?.startOffset || -1,
      //   end: range?.endOffset || -1,
      //   text: gridClickState.textSelectionString || ''
      // });

      gridClickState?.textSelection?.empty();
      setGridClickState(null);
    };
  };

  const handleGridContextMenu = (event: React.MouseEvent): void => {    
    let attrs: NamedNodeMap | undefined = (event.target as HTMLElement).attributes;
    if (!attrs?.length || !attrs.getNamedItem('data-column')) {
      attrs = (event.target as HTMLElement).parentElement?.attributes;
    }
    if (!attrs?.length || !attrs.getNamedItem('data-column')) {
      attrs = (event.target as HTMLElement).parentElement?.parentElement?.attributes;
    }
    if (!attrs) {
      console.error('Couldnt get attributes from target or parents. Event:', event);
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
      showContextMenu({ id: SPLIT_MENU_ID, event });
    } else {
      console.log('data row, no selection');
    }
  };

  const headerRow = useMemo(() => {
    return (
      <div
        className="flex font-medium sticky top-0 bg-gray-200 shadow-sm shadow-gray-400 select-none"
        data-transcript-line-idx="header"
      >

        {/* Phrase */}
        <div
          className={`px-2 py-2 border-r-0 border-b-1 border-gray-400 flex justify-end basis-[60px] shrink-0`}
          data-column data-column-id="line" data-transcript-line-idx="header"
        >
          Line
        </div>
        <div
          className={`px-2 py-2 border-r-0 border-b-1 border-gray-400 basis-[100px] shrink-0`}
          data-column data-column-id="speaker" data-transcript-line-idx="header"
        >
          Speaker
        </div>
        <div
          className={`px-2 py-2 border-r-0 border-b-1 border-gray-400 basis-[400px] grow-1`}
          data-column data-column-id="text" data-transcript-line-idx="header"
        >
          Phrase
        </div>

        {/* Repetition Of */}
        <div
          className={`px-2 py-2 border-r-0 border-b-1 border-gray-400 flex justify-end basis-[60px] shrink-0`}
          data-column data-column-id="line" data-transcript-line-idx="header"
        >
          Line
        </div>
        <div
          className={`px-2 py-2 border-r-0 border-b-1 border-gray-400 basis-[100px] shrink-0`}
          data-column data-column-id="speaker" data-transcript-line-idx="header"
        >
          Speaker
        </div>
        <div
          className={`px-2 py-2 border-r-0 border-b-1 border-gray-400 basis-[400px] grow-1`}
          data-column data-column-id="text" data-transcript-line-idx="header"
        >
          Repeated Phrase (Repetition Of)
        </div>

        {/* Other Info */}
        <div
          className={`px-2 py-2 border-r-0 border-b-1 border-gray-400 flex justify-end basis-[50px] shrink-0`}
          data-column data-column-id="line" data-transcript-line-idx="header"
        >
          Identical
        </div>
        <div
          className={`px-2 py-2 border-r-0 border-b-1 border-gray-400 basis-[50px] shrink-0`}
          data-column data-column-id="speaker" data-transcript-line-idx="header"
        >
          Type
        </div>
        <div
          className={`px-2 py-2 border-r-0 border-b-1 border-gray-400 basis-[200px] grow-1`}
          data-column data-column-id="text" data-transcript-line-idx="header"
        >
          Notes
        </div>

      </div>
    );
  }, []);

  const dataRows = useMemo(() => {
    return (
      <>
      {phraseRepetitions.map((rep, idx) => {
        const tl = transcriptLines[rep.phrase.transcriptLineIdx];
        const tlText = tl.speakerDetected ? tl.textWithoutSpeaker : tl.text;
        const phraseText = tlText?.substring(rep.phrase.start, rep.phrase.end);

        const repTl = transcriptLines[rep.repetionOf.transcriptLineIdx];
        const repTlText = repTl.speakerDetected ? repTl.textWithoutSpeaker : repTl.text;
        const repPhraseText = repTlText?.substring(rep.repetionOf.start, rep.repetionOf.end);

        return (
          <div 
            key={getPhraseRepetitionKey(rep)}
            className="flex"
            data-transcript-line-idx={idx}
          >

            {/* Phrase */}
            <div
              className="px-2 py-2 border-r-0 border-b-1 border-gray-400 flex justify-end basis-[60px] shrink-0 text-ellipsis overflow-hidden"
              data-column data-column-id="line" data-transcript-line-idx="header"
            >
              { tl.lineNumber }
            </div>
            <div
              className={`px-2 py-2 border-r-0 border-b-1 border-gray-400 basis-[100px] shrink-0`}
              data-column data-column-id="speaker" data-transcript-line-idx="header"
            >
              { tl.speaker }
            </div>
            <div
              className={`px-2 py-2 border-r-0 border-b-1 border-gray-400 basis-[400px] grow-1`}
              data-column data-column-id="text" data-transcript-line-idx="header"
            >
              { phraseText }
            </div>

            {/* Repetition Of */}
            <div
              className="px-2 py-2 border-r-0 border-b-1 border-gray-400 flex justify-end basis-[60px] shrink-0 text-ellipsis overflow-hidden"
              data-column data-column-id="line" data-transcript-line-idx="header"
            >
              { repTl.lineNumber }
            </div>
            <div
              className={`px-2 py-2 border-r-0 border-b-1 border-gray-400 basis-[100px] shrink-0`}
              data-column data-column-id="speaker" data-transcript-line-idx="header"
            >
              { repTl.speaker }
            </div>
            <div
              className={`px-2 py-2 border-r-0 border-b-1 border-gray-400 basis-[400px] grow-1`}
              data-column data-column-id="text" data-transcript-line-idx="header"
            >
              { repPhraseText }
            </div>

            {/* Other Info */}
            <div
              className={`px-2 py-2 border-r-0 border-b-1 border-gray-400 flex justify-end basis-[50px] shrink-0`}
              data-column data-column-id="line" data-transcript-line-idx="header"
            >
              { phraseText === repPhraseText ? '==' : '!=' }
            </div>
            <div
              className={`px-2 py-2 border-r-0 border-b-1 border-gray-400 basis-[50px] shrink-0`}
              data-column data-column-id="speaker" data-transcript-line-idx="header"
            >
              { tl.lineNumber === repTl.lineNumber ? 'Internal' : 'Across' }
            </div>
            <div
              className={`px-2 py-2 border-r-0 border-b-1 border-gray-400 basis-[200px] grow-1`}
              data-column data-column-id="text" data-transcript-line-idx="header"
            >
              { rep.note }
            </div>

          </div>
        );
      })}
      </>
    );
  }, [transcriptLines, phraseRepetitions]);

  return !phraseRepetitions?.length ? null : (
    <div
      className="flex flex-col overflow-auto box-border w-full"
      onContextMenu={handleGridContextMenu}
      style={style}
    >
      <SplitTextMenu
        textSelectionString={gridClickState?.textSelectionString || ''}
        groupColumnDefs={[]}
        onNewGroup={handleAddSelectionToNewGroup}
        onExistingGroup={handleAddSelectionToExistingGroup}
      />
      <ErrorMultipleLinesMenu />
      
      { headerRow }

      { dataRows }

    </div>
  );
};

export { PhraseGrid };
