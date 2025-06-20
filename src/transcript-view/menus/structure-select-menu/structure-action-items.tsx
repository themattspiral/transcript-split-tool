import { Item } from 'react-contexify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPenToSquare, faTrash } from '@fortawesome/free-solid-svg-icons';

import { MenuAction, PhraseLink } from '../../../shared/data';
import { useTranscriptInteraction } from '../../../context/transcript-interaction-context';
import { CONFIRM_DELETE } from '../../../modal/modal-messages';
import { useViewState } from '../../../context/view-state-context';
import { useUserData } from '../../../context/user-data-context';

interface StructureActionItemsProps {
  link: PhraseLink;
}

export const StructureActionItems: React.FC<StructureActionItemsProps> = ({ link }) => {
  const { handleStructureSelectMenuAction } = useTranscriptInteraction();
  const { showConfirmationModal } = useViewState();
  const { removePoeticStructure} = useUserData();

  return (
    <>

      <Item
        className="text-sm font-medium"
        onMouseOver={() => handleStructureSelectMenuAction(link.structure.id, MenuAction.HoverStructure)}
        onMouseOut={() => handleStructureSelectMenuAction('', MenuAction.Unhover)}
        onClick={() => handleStructureSelectMenuAction(link.structure.id, MenuAction.Edit)}
      >
        <div className="flex items-center">
          <FontAwesomeIcon icon={faPenToSquare} className="mr-1 w-[20px]" size="lg" />
          Edit
        </div>
      </Item>

      <Item
        className="text-sm font-medium destructive"
        onMouseOver={() => handleStructureSelectMenuAction(link.structure.id, MenuAction.HoverStructure)}
        onMouseOut={() => handleStructureSelectMenuAction('', MenuAction.Unhover)}
        onClick={() => showConfirmationModal(CONFIRM_DELETE, () => removePoeticStructure(link.structure.id))}
      >
        <div className="flex items-center">
          <FontAwesomeIcon icon={faTrash} className="mr-1 w-[20px]" size="lg" />
          Delete
        </div>
      </Item>

    </>
  );
};
