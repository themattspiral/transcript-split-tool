import { Menu, Item, Separator } from "react-contexify";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from "@fortawesome/free-solid-svg-icons";

interface RepeatedPhraseMenuProps {
  textSelectionString: string | null;
  onSetPhrase: () => void;
}

const REPEATED_PHRASE_MENU_ID = 'repeated-phrase-menu-id';

const RepeatedPhraseMenu: React.FC<RepeatedPhraseMenuProps> = props => {
  const { textSelectionString, onSetPhrase } = props;

  return (
    <Menu id={REPEATED_PHRASE_MENU_ID} className="max-w-dvw">
      <Item disabled style={{ opacity: 1 }}>
        <div className="font-medium text-ellipsis overflow-hidden">
          {textSelectionString}
        </div>
      </Item>
      
      <Separator />

      <Item onClick={onSetPhrase}>
        <div className="flex items-center">
          <FontAwesomeIcon icon={faPlus} className="mr-1" />
          Set Repeated Phrase
        </div>
      </Item>
    </Menu>
  );
};

export { REPEATED_PHRASE_MENU_ID, RepeatedPhraseMenu };
