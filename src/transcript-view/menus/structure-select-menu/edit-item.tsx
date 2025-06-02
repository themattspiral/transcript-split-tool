import { Item } from 'react-contexify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPenToSquare } from '@fortawesome/free-solid-svg-icons';

import { MenuAction, PhraseLink } from '../../../shared/data';
import { useTranscriptInteraction } from '../../../context/transcript-interaction-context';

interface EditItemProps {
  link: PhraseLink;
}

export const EditItem: React.FC<EditItemProps> = ({ link }) => {
  const { handleStructureSelectMenuAction } = useTranscriptInteraction();

  return (
    <Item
      className="text-sm font-medium"
      onMouseOver={() => handleStructureSelectMenuAction(link.structure.id, MenuAction.HoverStructure)}
      onMouseOut={() => handleStructureSelectMenuAction('', MenuAction.Unhover)}
      onClick={() => handleStructureSelectMenuAction(link.structure.id, MenuAction.Click)}
    >
      <FontAwesomeIcon icon={faPenToSquare} className="mr-1" size="lg" /> Edit Poetic Structure
    </Item>
  );
};
