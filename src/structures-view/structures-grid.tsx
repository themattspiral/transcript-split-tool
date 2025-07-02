import { useMemo, CSSProperties } from 'react';

import { HEADER_ROW_ID, PoeticStructureRelationshipType, getPhraseText, sortPoeticStructures } from 'data';
import { getGridColumnAttributes  } from '../shared/util';
import { useViewState } from 'context/view-state-context';
import { useProjectData } from 'context/project-data-context';

interface StructuresGridProps {
  style?: CSSProperties | undefined;
}

const StructuresGrid: React.FC<StructuresGridProps> = props => {
  const { style } = props;
  
  const { transcriptLines, poeticStructures } = useProjectData();
  // const { show: showContextMenu } = useContextMenu();
  // const { confirmModal } = useViewState();

  const sortedPoeticStructures = useMemo(() => {
    const structures = Object.values(poeticStructures);
    structures.sort(sortPoeticStructures);
    return structures;
  }, [poeticStructures]);

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

  const headerRow = useMemo(() => (
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
        Repetition
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
        Source
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
  ), []);

  const dataRows = useMemo(() => sortedPoeticStructures.map((structure, idx) => {
    // TODO - handle multiple & unary
    if (structure.relationshipType !== PoeticStructureRelationshipType.Paired) {
      return null;
    }

    const repetitionLine = transcriptLines[structure.repetition.lineNumber];
    const repetitionText = getPhraseText(structure.repetition, transcriptLines);

    const sourceLine = transcriptLines[structure.sources[0].lineNumber];
    const sourceText = getPhraseText(structure.sources[0], transcriptLines);

    return (
      <div className="flex" key={structure.id} data-phrase-rep-idx={idx}>

        {/* Repetition */}
        <div
          className="px-2 py-2 border-r-1 border-b-1 border-gray-400 flex justify-end basis-[60px] shrink-0 text-ellipsis overflow-hidden"
          data-phrase-rep-idx={idx}
        >
          { repetitionLine.lineNumber }
        </div>
        <div
          className={`px-2 py-2 border-r-1 border-b-1 border-gray-400 basis-[100px] shrink-0`}
          data-phrase-rep-idx={idx}
        >
          { repetitionLine.speaker }
        </div>
        <div
          className={`px-2 py-2 border-r-1 border-b-1 border-gray-400 basis-[30%] grow-1`}
          data-phrase-rep-idx={idx}
        >
          { repetitionText }
        </div>

        {/* Source */}
        <div
          className="px-2 py-2 border-r-1 border-b-1 border-gray-400 flex justify-end basis-[60px] shrink-0 text-ellipsis overflow-hidden"
          data-phrase-rep-idx={idx}
        >
          { sourceLine.lineNumber }
        </div>
        <div
          className={`px-2 py-2 border-r-1 border-b-1 border-gray-400 basis-[100px] shrink-0`}
          data-phrase-rep-idx={idx}
        >
          { sourceLine.speaker }
        </div>
        <div
          className={`px-2 py-2 border-r-1 border-b-1 border-gray-400 basis-[30%] grow-1`}
          data-phrase-rep-idx={idx}
        >
          { sourceText }
        </div>

        {/* Other Info */}
        <div
          className={`px-2 py-2 border-r-1 border-b-1 border-gray-400 flex justify-end basis-[60px] shrink-0`}
          data-phrase-rep-idx={idx}
        >
          { repetitionText === sourceText ? '==' : '!=' }
        </div>
        <div
          className={`px-2 py-2 border-r-1 border-b-1 border-gray-400 basis-[75px] shrink-0`}
          data-phrase-rep-idx={idx}
        >
          { repetitionLine.lineNumber === sourceLine.lineNumber ? 'Internal' : 'Across' }
        </div>
        <div
          className={`px-2 py-2 border-r-1 border-b-1 border-gray-400 basis-[10%] grow-1`}
          data-phrase-rep-idx={idx}
        >
          { structure.notes }
        </div>

      </div>
    );
  }), [transcriptLines, sortedPoeticStructures]);

  return sortedPoeticStructures?.length ? (
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
        No poetic structures defined yet.
      </h1>
      <h1 className="flex justify-center text-2xl text-gray-600">
        Highlight text within a transcript to get started.
      </h1>
    </div>
  );
};

export { StructuresGrid };
