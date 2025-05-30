import { useState, CSSProperties, useMemo, useCallback } from 'react';
import { useContextMenu } from 'react-contexify';
import classnames from 'classnames';

import { Phrase, HEADER_ROW_ID } from '../shared/data';
import { getGridColumnAttributes, getSelectionRangeContainerAttribute } from '../shared/util';
import { HIGHLIGHT_MENU_ID, ERROR_MULTIPLE_LINES_MENU_ID } from './menus/context-menu';
import { HighlightMenu } from './menus/highlight-menu';
import { ErrorMultipleLinesMenu } from './menus/error-multiple-lines-menu';
import { SplitTextCell } from './split-text-cell';
import { EditState, useStructureEdit } from '../context/structure-edit-context';
import { useUserData } from '../context/user-data-context';
import { useTranscriptInteraction } from '../context/transcript-interaction-context';
import { PhraseMenu } from './menus/phrase-menu/phrase-menu';

enum TranscriptGridColumnId {
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
  const { transcriptLines } = useUserData();
  const { editState } = useStructureEdit();
  const { clearClick, setHighlightedPhrase } = useTranscriptInteraction();

  const handleGridAction = useCallback((event: React.MouseEvent, handleAsPrimaryClick: boolean): void => {
    // using handler for onClick event, button was right click
    if (handleAsPrimaryClick && event.button !== 0) {
      clearClick();
      return;
    }

    // using handler for onClick, nothing being set/edited
    if (handleAsPrimaryClick && event.button === 0 && editState === EditState.Idle) {
      clearClick();
      return;
    }

    const sel = document.getSelection();
    const selText = sel?.toString();
    const range = sel?.getRangeAt(0);

    // using handler for onContextMenu, but no selection is present
    if (!handleAsPrimaryClick && (!sel || !selText || !range)) {
      clearClick();
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

    const lineNumberString = gridAttrs.getNamedItem('data-transcript-line-idx')?.value;
    const lineNumber = parseInt(lineNumberString || '');
    
    const beginPhraseLineStartIdxString = getSelectionRangeContainerAttribute(range?.startContainer, 'data-pls-idx');
    const endPhraseLineStartIdxString = getSelectionRangeContainerAttribute(range?.endContainer, 'data-pls-idx');
    const beginPhraseLineStartIdx = parseInt(beginPhraseLineStartIdxString || '0');
    const endPhraseLineStartIdx = parseInt(endPhraseLineStartIdxString || '0');
    
    const isHeaderRow: boolean = lineNumberString === HEADER_ROW_ID;
    const isTextColumn: boolean = columnIdString === TranscriptGridColumnId.Text;
    const hasSelection: boolean = !!selText && !!range;
    const hasMultiLineSelection: boolean = selText?.includes('\n') || false;

    if (hasMultiLineSelection) {
      if (event.preventDefault) event.preventDefault();
      showContextMenu({ id: ERROR_MULTIPLE_LINES_MENU_ID, event });
    } else if (!isHeaderRow && isTextColumn && hasSelection && range) {
      if (event.preventDefault) event.preventDefault();
      setHighlightedPhrase(new Phrase(
        lineNumber,
        (range.startOffset + beginPhraseLineStartIdx) || 0,
        (range.endOffset + endPhraseLineStartIdx) || 0
      ));
      showContextMenu({ event, id: HIGHLIGHT_MENU_ID });
    }
  }, [editState, clearClick, setHighlightedPhrase, showContextMenu]);

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
    { transcriptLines.map((line, idx) => idx === 0 ? null : (
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

          <SplitTextCell
            line={line}
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
  ), [transcriptLines, hoveredRowIdx, setHoveredRowIdx]);

  return transcriptLines?.length ? (
    <div
      className="flex flex-col overflow-auto box-border w-full font-mono"
      onClick={event => handleGridAction(event, true)}
      onContextMenu={event => handleGridAction(event, false)}
      style={style}
    >
      <PhraseMenu />
      <HighlightMenu />
      <ErrorMultipleLinesMenu />
      
      { headerRow }

      { dataRows }

    </div>
  ) : (
    <div className="flex flex-col grow-1 justify-center" style={style}>
      <h1 className="flex justify-center text-2xl text-gray-600">
        Please import a transcript to get started.
      </h1>
    </div>
  );
};

export { TranscriptGrid };
