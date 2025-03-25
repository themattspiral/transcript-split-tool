import { useState, useMemo, CSSProperties } from 'react';
import { useContextMenu } from "react-contexify";

import { GridAction, PhraseRepetition, TranscriptLine, HEADER_ROW_ID } from '../data/data';
import { getPhraseRepetitionKey, getGridColumnAttributes, getPhraseText } from '../util/util';
import { useViewState } from '../ViewStateContext';

interface PhraseGridProps {
  transcriptLines: TranscriptLine[];
  phraseRepetitions: PhraseRepetition[];
  style?: CSSProperties | undefined;
}

const PhraseGrid: React.FC<PhraseGridProps> = props => {
  const { transcriptLines, phraseRepetitions, style } = props;
  const [gridClickState, setGridClickState] = useState<GridAction | null>(null);
  const { show: showContextMenu } = useContextMenu();
  const { showConfirmationModal } = useViewState();

  // TODO
  const handleGridContextMenu = (event: React.MouseEvent): void => {    
    let attrs: NamedNodeMap | undefined = getGridColumnAttributes(event);
    if (!attrs) {
      console.error('Couldnt get attributes from target or immediate parents. Event:', event);
      return;
    }

    const transcriptLineIdxString = attrs.getNamedItem('data-phrase-rep-idx')?.value;
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
    } else if (hasSelection && isTextColumn) {
      // no selections here right?
      if (event.preventDefault) event.preventDefault();
    } else {
      console.log('data row, no selection');
    }
  };

  const headerRow = useMemo(() => {
    return (
      <div
        className="flex font-medium sticky top-0 bg-gray-200 shadow-sm shadow-gray-400 select-none"
        data-phrase-rep-idx={HEADER_ROW_ID}
      >

        {/* Phrase */}
        <div
          className={`px-2 py-2 border-r-1 border-b-1 border-gray-400 flex justify-end basis-[60px] shrink-0`}
          data-phrase-rep-idx={HEADER_ROW_ID}
        >
          Line
        </div>
        <div
          className={`px-2 py-2 border-r-1 border-b-1 border-gray-400 basis-[100px] shrink-0`}
          data-phrase-rep-idx={HEADER_ROW_ID}
        >
          Speaker
        </div>
        <div
          className={`px-2 py-2 border-r-1 border-b-1 border-gray-400 basis-[30%] grow-1`}
          data-phrase-rep-idx={HEADER_ROW_ID}
        >
          Phrase
        </div>

        {/* Repetition Of */}
        <div
          className={`px-2 py-2 border-r-1 border-b-1 border-gray-400 flex justify-end basis-[60px] shrink-0`}
          data-phrase-rep-idx={HEADER_ROW_ID}
        >
          Line
        </div>
        <div
          className={`px-2 py-2 border-r-1 border-b-1 border-gray-400 basis-[100px] shrink-0`}
          data-phrase-rep-idx={HEADER_ROW_ID}
        >
          Speaker
        </div>
        <div
          className={`px-2 py-2 border-r-1 border-b-1 border-gray-400 basis-[30%] grow-1`}
          data-phrase-rep-idx={HEADER_ROW_ID}
        >
          Repeated Phrase (Repetition Of)
        </div>

        {/* Other Info */}
        <div
          className={`px-2 py-2 border-r-1 border-b-1 border-gray-400 flex justify-end basis-[60px] shrink-0`}
          data-phrase-rep-idx={HEADER_ROW_ID}
        >
          Same
        </div>
        <div
          className={`px-2 py-2 border-r-1 border-b-1 border-gray-400 basis-[75px] shrink-0`}
          data-phrase-rep-idx={HEADER_ROW_ID}
        >
          Type
        </div>
        <div
          className={`px-2 py-2 border-r-1 border-b-1 border-gray-400 basis-[10%] grow-1`}
          data-phrase-rep-idx={HEADER_ROW_ID}
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
        const phraseText = getPhraseText(rep.phrase, transcriptLines);

        const repTl = transcriptLines[rep.repetionOf.transcriptLineIdx];
        const repPhraseText = getPhraseText(rep.repetionOf, transcriptLines);

        return (
          <div className="flex" key={getPhraseRepetitionKey(rep)} data-phrase-rep-idx={idx}>

            {/* Phrase */}
            <div
              className="px-2 py-2 border-r-1 border-b-1 border-gray-400 flex justify-end basis-[60px] shrink-0 text-ellipsis overflow-hidden"
              data-phrase-rep-idx={idx}
            >
              { tl.lineNumber }
            </div>
            <div
              className={`px-2 py-2 border-r-1 border-b-1 border-gray-400 basis-[100px] shrink-0`}
              data-phrase-rep-idx={idx}
            >
              { tl.speaker }
            </div>
            <div
              className={`px-2 py-2 border-r-1 border-b-1 border-gray-400 basis-[30%] grow-1`}
              data-phrase-rep-idx={idx}
            >
              { phraseText }
            </div>

            {/* Repetition Of */}
            <div
              className="px-2 py-2 border-r-1 border-b-1 border-gray-400 flex justify-end basis-[60px] shrink-0 text-ellipsis overflow-hidden"
              data-phrase-rep-idx={idx}
            >
              { repTl.lineNumber }
            </div>
            <div
              className={`px-2 py-2 border-r-1 border-b-1 border-gray-400 basis-[100px] shrink-0`}
              data-phrase-rep-idx={idx}
            >
              { repTl.speaker }
            </div>
            <div
              className={`px-2 py-2 border-r-1 border-b-1 border-gray-400 basis-[30%] grow-1`}
              data-phrase-rep-idx={idx}
            >
              { repPhraseText }
            </div>

            {/* Other Info */}
            <div
              className={`px-2 py-2 border-r-1 border-b-1 border-gray-400 flex justify-end basis-[60px] shrink-0`}
              data-phrase-rep-idx={idx}
            >
              { phraseText === repPhraseText ? '==' : '!=' }
            </div>
            <div
              className={`px-2 py-2 border-r-1 border-b-1 border-gray-400 basis-[75px] shrink-0`}
              data-phrase-rep-idx={idx}
            >
              { tl.lineNumber === repTl.lineNumber ? 'Internal' : 'Across' }
            </div>
            <div
              className={`px-2 py-2 border-r-1 border-b-1 border-gray-400 basis-[10%] grow-1`}
              data-phrase-rep-idx={idx}
            >
              { rep.note }
            </div>

          </div>
        );
      })}
      </>
    );
  }, [transcriptLines, phraseRepetitions]);

  return phraseRepetitions?.length ? (
    <div
      className="flex flex-col overflow-auto box-border w-full"
      onContextMenu={handleGridContextMenu}
      style={style}
    >
      
      { headerRow }

      { dataRows }

    </div>
  ) : null;
};

export { PhraseGrid };
