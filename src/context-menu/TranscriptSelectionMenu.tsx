import { Menu, Item, Separator } from "react-contexify";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faArrowsRotate } from "@fortawesome/free-solid-svg-icons";

import { useViewState } from "../ViewStateContext";
import './context-menu.css';

interface TranscriptSelectionMenuProps {
  textSelectionString: string | null;
  onSetPhrase: () => void;
  onSetRepeatedPhrase: () => void;
}

const TRANSCRIPT_SELECTION_MENU_ID = 'transcript-selection-menu-id';

const TranscriptSelectionMenu: React.FC<TranscriptSelectionMenuProps> = props => {
  const { textSelectionString, onSetPhrase, onSetRepeatedPhrase } = props;
  const { pendingPhrase, pendingRepeatedPhrase } = useViewState();

  return (
    <Menu id={TRANSCRIPT_SELECTION_MENU_ID} animation="slide" className="max-w-[400px] font-sans">
      <Item disabled style={{ opacity: 1 }}>
        <div className="font-bold font-mono flex whitespace-normal">
          { textSelectionString }
        </div>
      </Item>
      
      <Separator />

      <Item onClick={onSetPhrase}>
        <div className="flex items-center">
          <FontAwesomeIcon icon={pendingPhrase ? faArrowsRotate : faPlus} className="mr-1" />
          { pendingPhrase ? 'Replace' : 'Set as' }
          <span className="ml-1 rounded-xl px-[3px] mx-[-3px] bg-orange-200 border-orange-400 border-2 border-dashed font-mono text-always-menu-gray">
            phrase
          </span>
        </div>
      </Item>

      <Item onClick={onSetRepeatedPhrase}>
        <div className="flex items-center">
          <FontAwesomeIcon icon={pendingRepeatedPhrase ? faArrowsRotate : faPlus} className="mr-1" />
          { pendingRepeatedPhrase ? 'Replace' : 'Set as' }
          <span className="ml-1 rounded-xl px-[3px] mx-[-3px] bg-blue-200 border-blue-400 border-2 border-dashed font-mono text-always-menu-gray">
            repeated
          </span>
        </div>
      </Item>
    </Menu>
  );
};

export { TRANSCRIPT_SELECTION_MENU_ID, TranscriptSelectionMenu };
