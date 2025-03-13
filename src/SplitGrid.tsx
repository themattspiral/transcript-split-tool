import React, { useState, useRef, useMemo } from 'react';
import * as mammoth from 'mammoth';
import { useContextMenu } from "react-contexify";

import {
  addNewLinePart, removeLinePart, updateLinePartGroup, removeLinePartsForGroup,
  ColumnDef, DisplayTranscriptLine, GridClickState, TranscriptLine
} from './data';
import SplitterTextCell from './SplitterTextCell';
import { SPLIT_MENU_ID, SplitTextMenu } from './context-menu/SplitTextMenu';
import { ERROR_MULTIPLE_LINES_MENU_ID, ErrorMultipleLinesMenu } from './context-menu/ErrorMultipleLinesMenu';
import { LINE_PART_MENU_ID, LinePartMenu } from './context-menu/LinePartMenu';
import { HEADER_LINE_PART_MENU_ID, HeaderLinePartMenu } from './context-menu/HeaderLinePartMenu';

// import reactLogo from './assets/react.svg' // src
// import viteLogo from '/vite.svg'           // public

const LINE_COL_PX = 60;
const TEXT_COL_MIN_PX = 400;
const GROUP_COL_MIN_PX = 100;

const Split: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [transcriptLines, setTranscriptLines] = useState<TranscriptLine[]>([]);
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

    // fill out lines with no parts
    if (line.parts.length === 0) {
      groupColumnDefs.forEach(colDef => {
        lines[lineIdx].parts.push({ start: -1, end: -1, text: '', columnId: colDef.id, linePartIdx: -1 });
      });
    } else {
      while (partIdx < line.parts.length) {
        groupColumnDefs.forEach(colDef => {
          if (partIdx < line.parts.length && line.parts[partIdx].columnId === colDef.id) {
            lines[lineIdx].parts.push({ ...line.parts[partIdx], linePartIdx: partIdx });
            partIdx++;
          } else {
            lines[lineIdx].parts.push({ start: -1, end: -1, text: '', columnId: colDef.id, linePartIdx: -1 });
          }
        });

        if (partIdx < line.parts.length) {
          lines.push({
            text: '',
            isSubline: true,
            parts: [],
            displayLineNumber: `${line.lineNumber}.${lines.length}`,
            transcriptLineNumber: line.lineNumber
          });
          lineIdx++;
        }
      }
    }

    return lines;
  }), [groupColumnDefs, transcriptLines]);
  
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event?.target?.files?.[0];
    if (!file) {
      console.log('No file. Event target (input):', event?.target);
      return;
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      
      // split on newline, filter out empty lines, and transform
      const lines: TranscriptLine[] = result.value
        .split('\n')
        .filter(line => line.trim() !== '')
        .map((line, idx) => ({
          lineNumber: (idx + 1).toString(),
          text: line,
          parts: []
        }));

      setTranscriptLines(lines);

      if (result.messages?.length) {
        console.log('Document Parsing Messages:', result.messages);
      }

      // clear input so it may be reused with the same file if desired
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error processing document:', error);
      alert('Error processing document. Please try again.');
    }
  };

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

      setTranscriptLines(lines => addNewLinePart(lines, rowIdx, {
        columnId,
        start: range?.startOffset || -1,
        end: range?.endOffset || -1,
        text: gridClickState.textSelectionString || ''
      }));

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
      setTranscriptLines(lines => addNewLinePart(lines, rowIdx, {
        columnId,
        start: range?.startOffset || -1,
        end: range?.endOffset || -1,
        text: gridClickState.textSelectionString || ''
      }));

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
      setTranscriptLines(lines => removeLinePart(lines, rowIdx, gridClickState.linePartIdx as number));
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
      setTranscriptLines(lines => updateLinePartGroup(lines, rowIdx, gridClickState.linePartIdx as number, columnId));
    };
  };

  const handleRemoveGroup = (columnId: string) => {
    setTranscriptLines(lines => removeLinePartsForGroup(lines, columnId));
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
        columnId: columnIdString,
        transcriptLineNumber,
        textSelection: sel,
        textSelectionString: selText
      });
      showContextMenu({ id: SPLIT_MENU_ID, event });
    } else if (isGroupColumn) {
      event.preventDefault();
      setGridClickState({
        columnId: columnIdString || '?',
        transcriptLineNumber,
        textSelectionString: transcriptLines[transcriptLineNumber - 1].parts[linePartIdx].text,
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

  return (
    <div className="flex flex-col h-screen w-screen p-5 bg-gray-100 overflow-hidden"
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
        groupColumnDefs={groupColumnDefs}
        columnId={gridClickState?.columnId || ''}
        onRemove={handleRemoveGroup}
      />

      {/* Control Bar */}
      <div className="mb-4 flex gap-4 items-center">

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept=".docx"
          className="hidden"
        />
        <button
          onClick={() => {
            fileInputRef.current?.click();
          }}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 cursor-pointer"
        >
          Import New Transcript (Word)
        </button>
        <button
          onClick={() => {}}
          disabled={transcriptLines.length === 0}
          className={`px-4 py-2 rounded ${
            transcriptLines.length > 0 
              ? 'bg-green-500 text-white hover:bg-green-600 cursor-pointer' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Export Grid (Excel)
        </button>

      </div>
      
      {/* No Transcript Message */}
      {!transcriptLines?.length &&
        <h1 className="text-2xl mt-2">
          Please import a transcript to get started.
        </h1>
      }
      
      {/* Transcript Split Grid */}
      {transcriptLines?.length > 0 &&
        <div
          className="flex flex-col overflow-auto border-1 border-black box-border"
          onContextMenu={handleGridContextMenu}
        >
          
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
      }

    </div>
  );
};

export default Split;
