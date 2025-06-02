import { Item } from 'react-contexify';

import { getPhraseText, MenuAction, PhraseLink } from '../../../shared/data';
import { useUserData } from '../../../context/user-data-context';
import { useTranscriptInteraction } from '../../../context/transcript-interaction-context';
import { RepetitionClasses } from '../transcript-menus';

interface UnaryItemProps {
  link: PhraseLink;
}

export const UnaryItem: React.FC<UnaryItemProps> = ({ link }) => {
  const { transcriptLines } = useUserData();
  const { handlePhraseMenuAction } = useTranscriptInteraction();

  return (
    <Item
      onMouseOver={() => handlePhraseMenuAction(link.structure.id, MenuAction.HoverStructure)}
      onMouseOut={() => handlePhraseMenuAction('', MenuAction.Unhover)}
      onClick={() => handlePhraseMenuAction(link.structure.id, MenuAction.Click)}
    >
      <div>
        <span className={RepetitionClasses}>
          [U] { getPhraseText(link.structure.repetition, transcriptLines) }
        </span>
      </div>
    </Item>
  );
};
