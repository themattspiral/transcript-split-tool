import { useMemo, useCallback } from 'react';
import { useContextMenu } from 'react-contexify';
import classNames from 'classnames';

import { Badge } from 'components/badge';
import { Phrase, StylableProps } from 'data';
import { getGridColumnAttributes, getSelectionRangeContainerAttribute } from '../../../shared/util';
import { EditState, useStructureEdit } from 'context/structure-edit-context';
import { useTranscriptInteraction } from 'context/transcript-interaction-context';
import { TranscriptMenuId } from './menus/transcript-menus';
import { HighlightMenu } from './menus/highlight-menu';
import { ErrorMultipleLinesMenu } from './menus/error-multiple-lines-menu';
import { SplitTextCell } from './split-text-cell';
import { StructureSelectMenu } from './menus/structure-select-menu/structure-select-menu';

const TranscriptGrid: React.FC<StylableProps> = ({ className, style }) => {
  const { show: showContextMenu } = useContextMenu();
  const { editState } = useStructureEdit();
  const { setHighlightedPhrase, selectedTranscript } = useTranscriptInteraction();

  const handleGridAction = useCallback((event: React.MouseEvent, handleAsPrimaryClick: boolean): void => {
    // using handler for onClick event, button was right click
    if (handleAsPrimaryClick && event.button !== 0) {
      return;
    }

    // using handler for onClick, nothing being set/edited
    if (handleAsPrimaryClick && event.button === 0 && editState === EditState.Idle) {
      return;
    }

    const sel = document.getSelection();
    const selText = sel?.toString();
    const range = sel?.type === 'Range' ? sel.getRangeAt(0) : null;

    // using handler for onContextMenu, but no selection is present
    if (!handleAsPrimaryClick && (!sel || !selText || !range)) {
      return;
    }

    const gridAttrs: NamedNodeMap | undefined = getGridColumnAttributes(event);
    if (!gridAttrs) {
      return;
    }

    const lineNumberString = gridAttrs.getNamedItem('data-transcript-line-number')?.value;
    if (!lineNumberString) {
      return;
    }

    const lineNumber = parseInt(lineNumberString || '');
    
    const beginPhraseLineStartIdxString = getSelectionRangeContainerAttribute(range?.startContainer, 'data-span-start-idx');
    const endPhraseLineStartIdxString = getSelectionRangeContainerAttribute(range?.endContainer, 'data-span-start-idx');
    const beginPhraseLineStartIdx = parseInt(beginPhraseLineStartIdxString || '0');
    const endPhraseLineStartIdx = parseInt(endPhraseLineStartIdxString || '0');
    
    const hasSelection: boolean = !!selText && !!range;
    const hasMultiLineSelection: boolean = selText?.includes('\n') || false;

    if (hasMultiLineSelection) {
      if (event.preventDefault) event.preventDefault();
      showContextMenu({ event, id: TranscriptMenuId.ErrorMultipleLinesMenu });
    } else if (hasSelection && range && selectedTranscript) {
      if (event.preventDefault) event.preventDefault();
      setHighlightedPhrase(new Phrase(
        selectedTranscript.id,
        lineNumber,
        (range.startOffset + beginPhraseLineStartIdx) || 0,
        (range.endOffset + endPhraseLineStartIdx) || 0
      ));
      showContextMenu({ event, id: TranscriptMenuId.HighlightMenu });
    }
  }, [editState, setHighlightedPhrase, showContextMenu]);

  const headerRow = useMemo(() => (
    <div className="flex font-medium font-sans sticky top-0 z-5 bg-gray-200 shadow-sm shadow-gray-400 select-none">
      <div className="px-2 py-2 border-b-1 border-gray-400 flex justify-center basis-[65px] shrink-0">
        Line
      </div>
      <div className="px-2 py-2 border-b-1 border-gray-400 basis-[100px] shrink-0">
        Speaker
      </div>
      <div className="px-2 py-2 border-b-1 border-gray-400 grow-1">
        Transcript Text
      </div>
    </div>
  ), []);

  const dataRows = useMemo(() => selectedTranscript?.lines.map((line, idx) => idx === 0 ? null : (
    <div key={line.lineNumber} className={classNames('flex', { ['bg-gray-100']: line.lineNumber % 2 === 0 })}>

      <div className="px-2 py-2 border-b-1 border-gray-400 flex justify-center items-center basis-[65px] shrink-0">
        <Badge mode="line-number" size="large" style={{marginRight: '0'}}>
          { line.lineNumber }
        </Badge>
      </div>

      <div className="px-2 py-2 border-b-1 border-gray-400 basis-[100px] shrink-0 flex items-center">
        { line.speaker }
      </div>

      <SplitTextCell
        line={line}
        className="border-b-1 border-gray-400 grow-1"
        attributes={{
          ['data-column']: 'true',
          ['data-transcript-line-number']: line.lineNumber
        }}
      />

    </div>
  )), [selectedTranscript]);

  return selectedTranscript?.lines?.length ? (
    <div
      className={classNames('flex flex-col overflow-auto box-border w-full', className)}
      onClick={event => handleGridAction(event, true)}
      onContextMenu={event => handleGridAction(event, false)}
      style={style}
    >
      <StructureSelectMenu />
      <HighlightMenu />
      <ErrorMultipleLinesMenu />
      
      { headerRow }

      { dataRows }

    </div>
  ) : (
    <div className={classNames('flex flex-col justify-center', className)} style={style}>
      <h1 className="flex justify-center text-2xl text-gray-600 p-2">
        Please import a Word document to get started on this transcript.
      </h1>
    </div>
  );
};

export { TranscriptGrid };
