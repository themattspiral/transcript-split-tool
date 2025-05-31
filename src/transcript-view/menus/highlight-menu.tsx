import { useMemo } from 'react';
import { Menu, Item, Separator } from 'react-contexify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faArrowsRotate } from '@fortawesome/free-solid-svg-icons';

import './transcript-menus.css';
import { TranscriptMenuId } from './transcript-menus';
import { getPhraseText, PhraseRole } from '../../shared/data';
import { useStructureEdit } from '../../context/structure-edit-context';
import { useUserData } from '../../context/user-data-context';
import { useTranscriptInteraction } from '../../context/transcript-interaction-context';
import { clearDocumentTextSelection } from '../../shared/util';

export const HighlightMenu: React.FC = () => {
  const { transcriptLines } = useUserData();
  const { highlightedPhrase, makeHighlightedPhrasePending, updateMenuVisibility } = useTranscriptInteraction();
  const { pendingRepetition, pendingSource } = useStructureEdit();

  const selectedText = useMemo(() => getPhraseText(highlightedPhrase, transcriptLines), [highlightedPhrase, transcriptLines]);

  return (
    <Menu
      id={TranscriptMenuId.HighlightMenu}
      animation="slide"
      className="max-w-[400px] font-sans"
      onVisibilityChange={isVisible => updateMenuVisibility(TranscriptMenuId.HighlightMenu, isVisible)}
    >
      <div className="text-xs">New Poetic Strcture:</div>

      <Item disabled style={{ opacity: 1 }}>
        <div className="font-bold font-mono flex whitespace-normal">
          { selectedText }
        </div>
      </Item>
      
      <Separator />

      <Item onClick={() => {
        makeHighlightedPhrasePending(PhraseRole.Repetition);
        clearDocumentTextSelection();
      }}>
        <div className="flex items-center">
          <FontAwesomeIcon icon={pendingRepetition ? faArrowsRotate : faPlus} className="mr-1" />
          { pendingRepetition ? 'Replace' : 'Set as' }
          <span className="ml-1 rounded-xl px-[3px] mx-[-3px] bg-orange-200 border-orange-400 border-2 border-dashed font-mono text-always-menu-gray">
            Repetition
          </span>
        </div>
      </Item>

      <Item onClick={() => {
        makeHighlightedPhrasePending(PhraseRole.Source);
        clearDocumentTextSelection();
      }}>
        <div className="flex items-center">
          <FontAwesomeIcon icon={pendingSource ? faArrowsRotate : faPlus} className="mr-1" />
          { pendingSource ? 'Replace' : 'Set as' }
          <span className="ml-1 rounded-xl px-[3px] mx-[-3px] bg-blue-200 border-blue-400 border-2 border-dashed font-mono text-always-menu-gray">
            Source
          </span>
        </div>
      </Item>
    </Menu>
  );
};
