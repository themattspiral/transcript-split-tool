import { useMemo } from "react";
import { Menu, Item, Separator } from "react-contexify";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPenToSquare } from "@fortawesome/free-solid-svg-icons";

import './context-menu.css';
import { getPhraseText } from "../util/util";
import { useUserData } from "../context/UserDataContext";
import { useEditState } from "../context/EditStateContext";

const PHRASE_EDIT_MENU_ID = 'phrase-edit-menu-id';

const PhraseEditMenu: React.FC = () => {
  const { transcriptLines } = useUserData();
  const { contextPhrase, editContextPhraseRepetition } = useEditState();

  const selectedText = useMemo(() => getPhraseText(contextPhrase, transcriptLines), [contextPhrase, transcriptLines]);
  
  return (
    <Menu id={PHRASE_EDIT_MENU_ID} animation="slide" className="max-w-[400px] font-sans">
      <Item disabled style={{ opacity: 1 }}>
        <div className="font-bold font-mono flex whitespace-normal">
          { selectedText }
        </div>
      </Item>
      
      <Separator />

      <Item onClick={editContextPhraseRepetition}>
        <div className="flex items-center">
          <FontAwesomeIcon icon={faPenToSquare} className="mr-1" />
          Edit
        </div>
      </Item>
    </Menu>
  );
};

export { PHRASE_EDIT_MENU_ID, PhraseEditMenu };
