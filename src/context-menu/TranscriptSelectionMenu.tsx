import { useMemo } from "react";
import { Menu, Item, Separator } from "react-contexify";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faArrowsRotate } from "@fortawesome/free-solid-svg-icons";

import './context-menu.css';
import { getPhraseText, PhraseRole } from "../data/data";
import { useStructureEdit } from "../context/StructureEditContext";
import { useUserData } from "../context/UserDataContext";
import { useTranscriptInteraction } from "../context/TranscriptInteractionContext";
import { clearDocumentTextSelection } from "../util/util";

const TRANSCRIPT_SELECTION_MENU_ID = 'transcript-selection-menu-id';

const TranscriptSelectionMenu: React.FC = () => {
  const { transcriptLines } = useUserData();
  const { highlightedPhrase, makeHighlightedPhrasePending } = useTranscriptInteraction();
  const { pendingRepetition, pendingSource } = useStructureEdit();

  const selectedText = useMemo(() => getPhraseText(highlightedPhrase, transcriptLines), [highlightedPhrase, transcriptLines]);

  return (
    <Menu id={TRANSCRIPT_SELECTION_MENU_ID} animation="slide" className="max-w-[400px] font-sans">
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

export { TRANSCRIPT_SELECTION_MENU_ID, TranscriptSelectionMenu };
