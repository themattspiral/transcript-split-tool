import { useMemo, CSSProperties } from 'react';
import { useContextMenu } from "react-contexify";

import { HEADER_ROW_ID } from '../data/data';
import { getPhraseRepetitionKey, getGridColumnAttributes, getPhraseText, sortPhraseRepetitions } from '../util/util';
import { useViewState } from '../context/ViewStateContext';
import { useUserData } from '../context/UserDataContext';

interface PhraseGridProps {
  style?: CSSProperties | undefined;
}

const PhraseGrid: React.FC<PhraseGridProps> = props => {
  const { style } = props;
  
  const { transcriptLines, phraseRepetitions } = useUserData();
  const { show: showContextMenu } = useContextMenu();
  const { showConfirmationModal } = useViewState();

  const sortedPhraseRepetitions = useMemo(() => {
    const reps = Object.values(phraseRepetitions);
    reps.sort(sortPhraseRepetitions);
    return reps;
  }, [phraseRepetitions]);

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
      {sortedPhraseRepetitions.map((rep, idx) => {
        const tl = transcriptLines[rep.phrase.transcriptLineIdx];
        const phraseText = getPhraseText(rep.phrase, transcriptLines);

        const repTl = transcriptLines[rep.repeatedPhrase.transcriptLineIdx];
        const repPhraseText = getPhraseText(rep.repeatedPhrase, transcriptLines);

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
  }, [transcriptLines, sortedPhraseRepetitions]);

  return sortedPhraseRepetitions?.length ? (
    <div
      className="flex flex-col overflow-auto box-border w-full"
      onContextMenu={handleGridContextMenu}
      style={style}
    >
      
      { headerRow }

      { dataRows }

    </div>
  ) : (
    <div className="flex flex-col grow-1 justify-center" style={style}>
      <h1 className="flex justify-center text-2xl text-gray-600 mb-4">
        No phrase repetitions defined yet.
      </h1>
      <h1 className="flex justify-center text-2xl text-gray-600">
        Highlight text within a transcript to get started.
      </h1>
    </div>
  );
};

export { PhraseGrid };
