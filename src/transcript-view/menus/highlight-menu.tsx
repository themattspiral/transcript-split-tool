import { useMemo } from 'react';
import { Menu, Item, Separator } from 'react-contexify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faArrowsRotate, faPenToSquare } from '@fortawesome/free-solid-svg-icons';

import { TranscriptMenuId } from './transcript-menus';
import { getPhraseText, PhraseRole, SpanType } from '../../shared/data';
import { EditState, useStructureEdit } from '../../context/structure-edit-context';
import { useUserData } from '../../context/user-data-context';
import { useTranscriptInteraction } from '../../context/transcript-interaction-context';
import { clearDocumentTextSelection } from '../../shared/util';
import { SimpleSpanBubble } from '../../shared/components/simple-span-bubble';

export const HighlightMenu: React.FC = () => {
  const { transcriptLines } = useUserData();
  const { highlightedPhrase, makeHighlightedPhrasePending, updateMenuVisibility } = useTranscriptInteraction();
  const { editState, editInfo } = useStructureEdit();

  const highlightedText = useMemo(() => getPhraseText(highlightedPhrase, transcriptLines), [highlightedPhrase, transcriptLines]);
  const showEditHeader = editState === EditState.EditingExisting;

  return (
    <Menu
      id={TranscriptMenuId.HighlightMenu}
      animation="slide"
      className="max-w-[400px] font-sans"
      onVisibilityChange={isVisible => updateMenuVisibility(TranscriptMenuId.HighlightMenu, isVisible)}
    >
      <Item
        key="menu-header" disabled style={{ opacity: 1 }}
        className="menu-header bg-gray-200 px-1 pt-[3px] pb-[2px] border-b-1 border-gray-500 mb-2 text-gray-600 text-sm font-medium"
      >
        <div className="w-full flex justify-end items-center">
          { showEditHeader ? 'Edit' : 'New' }  Poetic Strcture
          <FontAwesomeIcon icon={showEditHeader ? faPenToSquare : faPlus} className="ml-1" size="sm" />
        </div>
      </Item>

      <Item disabled style={{ opacity: 1 }}>
        <div className="font-bold font-mono whitespace-normal w-full flex justify-end">
          { highlightedText }
        </div>
      </Item>
      
      <Separator />

      <Item onClick={() => {
        makeHighlightedPhrasePending(PhraseRole.Repetition);
        clearDocumentTextSelection();
      }}>
        <div className="flex items-center">
          <FontAwesomeIcon icon={editInfo.repetitionToShow ? faArrowsRotate : faPlus} className="mr-1" />
          { editInfo.repetitionToShow ? 'Replace' : 'Set as' }

          <SimpleSpanBubble
            spanType={SpanType.Repetition}
            mode="menu"
            className="ml-1 border-gray-600 border-2 border-dashed"
          >
            Repetition
          </SimpleSpanBubble>
        </div>
      </Item>

      <Item onClick={() => {
        makeHighlightedPhrasePending(PhraseRole.Source);
        clearDocumentTextSelection();
      }}>
        <div className="flex items-center">
          <FontAwesomeIcon icon={editInfo.sourceToShow ? faArrowsRotate : faPlus} className="mr-1" />
          { editInfo.sourceToShow ? 'Replace' : 'Set as' }
          
          <SimpleSpanBubble
            spanType={SpanType.Source}
            mode="menu"
            className="ml-1 border-gray-600 border-2 border-dashed"
          >
            Source
          </SimpleSpanBubble>
        </div>
      </Item>
    </Menu>
  );
};
