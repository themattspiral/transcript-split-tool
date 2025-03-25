import { Menu, Item, Separator } from "react-contexify";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from "@fortawesome/free-solid-svg-icons";

interface NewPhraseMenuProps {
  textSelectionString: string | null;
  onSetPhrase: () => void;
}

const NEW_PHRASE_MENU_ID = 'new-phrase-menu-id';

const NewPhraseMenu: React.FC<NewPhraseMenuProps> = props => {
  const { textSelectionString, onSetPhrase } = props;

  return (
    <Menu id={NEW_PHRASE_MENU_ID} className="max-w-dvw font-sans">
      <Item disabled style={{ opacity: 1 }}>
        <div className="font-medium font-mono text-ellipsis overflow-hidden">
          { textSelectionString }
        </div>
      </Item>
      
      <Separator />

      <Item onClick={onSetPhrase}>
        <div className="flex items-center">
          <FontAwesomeIcon icon={faPlus} className="mr-1" />
          Define new phrase...
        </div>
      </Item>
    </Menu>
  );
};

export { NEW_PHRASE_MENU_ID, NewPhraseMenu };
