import { useMemo } from "react";
import { Menu, Item, Separator, Submenu } from "react-contexify";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPenToSquare } from "@fortawesome/free-solid-svg-icons";

import './context-menu.css';
import { getPhraseText } from "../data/data";
import { useUserData } from "../context/UserDataContext";
import { useEditState } from "../context/EditStateContext";

const PHRASE_EDIT_MENU_ID = 'phrase-edit-menu-id';

const PhraseEditMenu: React.FC = () => {
  const { transcriptLines } = useUserData();
  const { contextPhrase, contextPhraseAssociations, editContextPhraseRepetition } = useEditState();

  const selectedText = useMemo(() => getPhraseText(contextPhrase, transcriptLines), [contextPhrase, transcriptLines]);

  const editOptions = useMemo(() => {
    return contextPhraseAssociations.map((pa, idx) => (
      <Submenu key={`${pa.phrase.start}:${pa.phrase.end}-${pa.repetitionId}`} label={
        <div className="flex items-center">
          { getPhraseText(pa.phrase, transcriptLines) }
        </div>
      }>
        <Item onClick={() => editContextPhraseRepetition(idx)}>
          <div className="flex items-center">
            <FontAwesomeIcon icon={faPenToSquare} className="mr-1" />
            Edit
          </div>
        </Item>
      </Submenu>
    ));
  }, [contextPhraseAssociations, transcriptLines]);
  
  return (
    <Menu id={PHRASE_EDIT_MENU_ID} animation="slide" className="max-w-[400px] font-sans">
      <Item disabled style={{ opacity: 1 }}>
        <div className="font-bold font-mono flex whitespace-normal">
          { selectedText }
        </div>
      </Item>
      
      <Separator />

      { editOptions.length === 1 &&
        <Item onClick={() => editContextPhraseRepetition(0)}>
          <div className="flex items-center">
            <FontAwesomeIcon icon={faPenToSquare} className="mr-1" />
            Edit
          </div>
        </Item>
      }

      { editOptions.length > 1 && editOptions }
    </Menu>
  );
};

export { PHRASE_EDIT_MENU_ID, PhraseEditMenu };
