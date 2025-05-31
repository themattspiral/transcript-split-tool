import { Item } from 'react-contexify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPenToSquare } from '@fortawesome/free-solid-svg-icons';

import { MenuAction, PhraseLink } from '../../../shared/data';
import { useTranscriptInteraction } from '../../../context/transcript-interaction-context';

interface EditItemProps {
  link: PhraseLink;
}

export const EditItem: React.FC<EditItemProps> = ({ link }) => {
  const { handlePhraseMenuAction } = useTranscriptInteraction();

  return (
    <Item
      onMouseOver={() => handlePhraseMenuAction(link.structure.id, MenuAction.HoverStructure)}
      onMouseOut={() => handlePhraseMenuAction('', MenuAction.Unhover)}
      onClick={() => handlePhraseMenuAction(link.structure.id, MenuAction.Click)}
    >
      <FontAwesomeIcon icon={faPenToSquare} className="mr-1" /> Edit
    </Item>
  );
};
