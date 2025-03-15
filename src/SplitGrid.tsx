import { useState, useMemo } from 'react';
import { useContextMenu } from "react-contexify";

import { ColumnDef, DisplayTranscriptLine, GridClickState, LinePart, TranscriptLine } from './data';
import SplitterTextCell from './SplitterTextCell';
import { SPLIT_MENU_ID, SplitTextMenu } from './context-menu/SplitTextMenu';
import { ERROR_MULTIPLE_LINES_MENU_ID, ErrorMultipleLinesMenu } from './context-menu/ErrorMultipleLinesMenu';
import { LINE_PART_MENU_ID, LinePartMenu } from './context-menu/LinePartMenu';
import { HEADER_LINE_PART_MENU_ID, HeaderLinePartMenu } from './context-menu/HeaderLinePartMenu';

const LINE_COL_PX = 60;
const TEXT_COL_MIN_PX = 400;
const GROUP_COL_MIN_PX = 100;

interface SplitGridProps {
  transcriptLines: TranscriptLine[];
  onAddTextSelectionToNewGroup: (rowIdx: number, newlinePart: LinePart) => void;
  onAddTextSelectionToExistingGroup: (rowIdx: number, newlinePart: LinePart) => void;
  onRemoveTextSelectionFromGroup: (rowIdx: number, linePartIdx: number) => void;
  onUpdateTextSelectionGroup: (rowIdx: number, linePartIdx: number, newColumnId: string) => void;
  onDeleteGroup: (columnId: string) => void;
}

const SplitGrid: React.FC<SplitGridProps> = props => {
  const {
    transcriptLines,
    onAddTextSelectionToNewGroup,
    onAddTextSelectionToExistingGroup,
    onRemoveTextSelectionFromGroup,
    onUpdateTextSelectionGroup,
    onDeleteGroup
  } = props;
  const [nextColId, setNextColId] = useState<number>(0);
  const [groupColumnDefs, setGroupColumnDefs] = useState<ColumnDef[]>([]);
  const [gridClickState, setGridClickState] = useState<GridClickState | null>(null);
  const { show: showContextMenu } = useContextMenu();

  const minWidth = LINE_COL_PX + TEXT_COL_MIN_PX + (groupColumnDefs.length * GROUP_COL_MIN_PX);

  const displayLines: DisplayTranscriptLine[] = useMemo(() => transcriptLines.flatMap(line => {
    let lineIdx = 0;
    let partIdx = 0;
    const lines: DisplayTranscriptLine[] = [{
      text: line.text,
      isSubline: false,
      parts: [],
      displayLineNumber: line.lineNumber,
      transcriptLineNumber: line.lineNumber
    }];
    groupColumnDefs.forEach(colDef => {
      lines[lineIdx].parts.push({ start: -1, end: -1, text: '', columnId: colDef.id, linePartIdx: -1 });
    });

    while (partIdx < line.parts.length) {
      lines.push({
        text: '',
        isSubline: true,
        parts: [],
        displayLineNumber: `${line.lineNumber}.${lines.length}`,
        transcriptLineNumber: line.lineNumber
      });
      lineIdx++;

      groupColumnDefs.forEach(colDef => {
        if (partIdx < line.parts.length && line.parts[partIdx].columnId === colDef.id) {
          lines[lineIdx].parts.push({ ...line.parts[partIdx], linePartIdx: partIdx });
          partIdx++;
        } else {
          lines[lineIdx].parts.push({ start: -1, end: -1, text: '', columnId: colDef.id, linePartIdx: -1 });
        }
      });
    }

    return lines;
  }), [groupColumnDefs, transcriptLines]);

  const addColumn = (): string => {
    const next = nextColId;
    
    setGroupColumnDefs(defs => [...defs, { id: next.toString(), label: `Group ${nextColId}` }]);
    setNextColId(next + 1);

    return next.toString();
  };

  const handleAddSelectionToNewGroup = () => {
    if (!Number.isInteger(gridClickState?.transcriptLineNumber)
      || !gridClickState?.textSelection
      || !gridClickState?.textSelectionString
    ) {
      return;
    }

    const rowIdx = gridClickState?.transcriptLineNumber as number - 1;
    const range = gridClickState.textSelection.getRangeAt(0);
  
    if (rowIdx >= 0) {
      const columnId = addColumn();

      onAddTextSelectionToNewGroup(rowIdx, {
        columnId,
        start: range?.startOffset || -1,
        end: range?.endOffset || -1,
        text: gridClickState.textSelectionString || ''
      });

      gridClickState?.textSelection?.empty();
      setGridClickState(null);
    };
  };

  const handleAddSelectionToExistingGroup = (columnId: string) => {
    if (!Number.isInteger(gridClickState?.transcriptLineNumber)
      || !gridClickState?.textSelection
      || !gridClickState?.textSelectionString
    ) {
      return;
    }

    const rowIdx = gridClickState?.transcriptLineNumber as number - 1;
    const range = gridClickState.textSelection.getRangeAt(0);
  
    if (rowIdx >= 0) {
      onAddTextSelectionToExistingGroup(rowIdx, {
        columnId,
        start: range?.startOffset || -1,
        end: range?.endOffset || -1,
        text: gridClickState.textSelectionString || ''
      });

      gridClickState?.textSelection?.empty();
      setGridClickState(null);
    };
  };

  const handleRemoveSelection = () => {
    if (!Number.isInteger(gridClickState?.transcriptLineNumber)
      || !Number.isInteger(gridClickState?.linePartIdx)
      || !gridClickState?.textSelectionString
    ) {
      return;
    }

    const rowIdx = gridClickState.transcriptLineNumber as number - 1;
  
    if (rowIdx >= 0) {
      onRemoveTextSelectionFromGroup(rowIdx, gridClickState.linePartIdx as number);
    };
  };

  const handleChangeSelectionGroup = (columnId: string) => {
    if (!Number.isInteger(gridClickState?.transcriptLineNumber)
      || !Number.isInteger(gridClickState?.linePartIdx)
      || !gridClickState?.textSelectionString
    ) {
      return;
    }

    const rowIdx = gridClickState.transcriptLineNumber as number - 1;
  
    if (rowIdx >= 0) {
      onUpdateTextSelectionGroup(rowIdx, gridClickState.linePartIdx as number, columnId);
    };
  };

  const handleRemoveGroup = (columnId: string) => {
    onDeleteGroup(columnId);
    setGroupColumnDefs(colDefs => colDefs.filter(def => def.id != columnId));
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

    const transcriptLineNumberString = attrs.getNamedItem('data-transcript-line-number')?.value;
    const isSublineString = attrs.getNamedItem('data-is-subline')?.value;
    const columnIdString = attrs.getNamedItem('data-column-id')?.value;
    const linePartIdxString = attrs.getNamedItem('data-line-part-idx')?.value;
    const sel = document.getSelection();
    const selText = sel?.toString();
    
    const isHeaderRow = transcriptLineNumberString === 'header';
    const transcriptLineNumber = parseInt(transcriptLineNumberString || '');
    const isSubline = isSublineString === 'true';
    const isTextColumn = columnIdString === 'text';
    const isGroupColumn = columnIdString != 'line' && columnIdString != 'text';
    const linePartIdx = parseInt(linePartIdxString || '');
    const hasSelection: boolean = !!selText;
    const hasMultiLineSelection: boolean = selText?.includes('\n') || false;

    if (!columnIdString) {
      console.error('Couldnt determine column. Event:', event);
      return;
    }

    if (isHeaderRow) {
      if (isGroupColumn) {
        event.preventDefault();
        setGridClickState({
          columnId: columnIdString || '?',
          transcriptLineNumber: NaN
        });
        showContextMenu({ id: HEADER_LINE_PART_MENU_ID, event });
      }
    } else if (hasMultiLineSelection) {
      event.preventDefault();
      showContextMenu({ id: ERROR_MULTIPLE_LINES_MENU_ID, event });
    } else if (hasSelection && isTextColumn && !isSubline) {
      event.preventDefault();
      setGridClickState({
        columnId: columnIdString || '?',
        transcriptLineNumber,
        textSelection: sel,
        textSelectionString: selText
      });
      showContextMenu({ id: SPLIT_MENU_ID, event });
    } else if (isGroupColumn && linePartIdx >= 0) {
      event.preventDefault();
      setGridClickState({
        columnId: columnIdString || '?',
        transcriptLineNumber,
        textSelectionString: transcriptLines[transcriptLineNumber - 1].parts[linePartIdx]?.text,
        linePartIdx
      });
      showContextMenu({ id: LINE_PART_MENU_ID, event });
    } else if (isSubline) {
      console.log('subline');
    } else {
      // data row no text selection
      console.log('data row, no selection');
    }
  };

  return !transcriptLines?.length ? null : (
    <div
      className="flex flex-col overflow-auto border-1 border-black box-border"
      onContextMenu={handleGridContextMenu}
    >
      <SplitTextMenu
        textSelectionString={gridClickState?.textSelectionString || ''}
        groupColumnDefs={groupColumnDefs}
        onNewGroup={handleAddSelectionToNewGroup}
        onExistingGroup={handleAddSelectionToExistingGroup}
      />
      <ErrorMultipleLinesMenu />
      <LinePartMenu
        textSelectionString={gridClickState?.textSelectionString || ''}
        groupColumnDefs={groupColumnDefs}
        columnId={gridClickState?.columnId || ''}
        onRemove={handleRemoveSelection}
        onMove={handleChangeSelectionGroup}
      />
      <HeaderLinePartMenu
        columnId={gridClickState?.columnId || ''}
        groupColumnDefs={groupColumnDefs}
        onRename={columnId => {
          console.log('raname column:', columnId);
        }}
        onRemove={handleRemoveGroup}
      />
      
      {/* Header Row */}
      <div
        className="flex font-medium sticky top-0 bg-gray-200 shadow-md shadow-gray-400 select-none"
        style={{ minWidth: `${minWidth}px` }}
        data-transcript-line-number="header"
      >

        <div
          className={`px-2 py-2 border-r-1 border-b-1 border-gray-400 flex justify-end`}
          style={{ flex: `0 0 ${LINE_COL_PX}px` }}
          data-column
          data-column-id="line"
          data-transcript-line-number="header"
        >
          Line
        </div>
        <div
          className={`px-2 py-2 border-r-1 border-b-1 border-gray-400`}
          style={{ flex: `2 0 ${TEXT_COL_MIN_PX}px` }}
          data-column
          data-column-id="text"
          data-transcript-line-number="header"
        >
          Transcript Text
        </div>

        {groupColumnDefs.map(colDef => {
          return (
            <div
              key={colDef.id}
              className={`px-2 py-2 border-r-1 border-b-1 border-gray-400 text-ellipsis overflow-hidden`}
              style={{ flex: `1 0 ${GROUP_COL_MIN_PX}px` }}
              data-column
              data-column-id={colDef.id}
              data-transcript-line-number="header"
            >
              {colDef.label}
            </div>
          );
        })}
      </div>

      {/* Data Rows */}
      {displayLines.map(line => {
        return (
          <div 
            key={line.displayLineNumber}
            className="flex bg-transparent"
            style={{ minWidth: `${minWidth}px` }}
            data-transcript-line-number={line.transcriptLineNumber}
            data-is-subline={line.isSubline}
          >

            <div
              className={`px-2 py-2 border-r-1 border-b-1 border-gray-400 flex justify-end text-ellipsis overflow-hidden`}
              style={{ flex: `0 0 ${LINE_COL_PX}px` }}
              data-column
              data-column-id="line"
              data-transcript-line-number={line.transcriptLineNumber}
              data-is-subline={line.isSubline}
            >
              {line.displayLineNumber}
            </div>
            <div
              className={`px-2 py-2 border-r-1 border-b-1 border-gray-400`}
              style={{ flex: `2 0 ${TEXT_COL_MIN_PX}px` }}
              data-column
              data-column-id="text"
              data-transcript-line-number={line.transcriptLineNumber}
              data-is-subline={line.isSubline}
            >
              <SplitterTextCell line={line} />
            </div>

            {line.parts.map(part => {
              return (
                <div
                  key={part.columnId}
                  className={`px-2 py-2 border-r-1 border-b-1 border-gray-400 text-ellipsis overflow-hidden`}
                  style={{ flex: `1 0 ${GROUP_COL_MIN_PX}px` }}
                  data-column
                  data-column-id={part.columnId}
                  data-transcript-line-number={line.transcriptLineNumber}
                  data-is-subline={line.isSubline}
                  data-line-part-idx={part.linePartIdx}
                >
                  {part.text}
                </div>
              );
            })}

          </div>
        );
      })}

    </div>
  );
};

export { SplitGrid };
