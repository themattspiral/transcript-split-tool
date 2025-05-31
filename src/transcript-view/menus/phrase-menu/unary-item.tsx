import { Item } from 'react-contexify';

import { getPhraseText, MenuAction, PhraseLink } from '../../../shared/data';
import { useUserData } from '../../../context/user-data-context';
import { useTranscriptInteraction } from '../../../context/transcript-interaction-context';

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
      rep (unary): { getPhraseText(link.structure.repetition, transcriptLines) }
    </Item>
  );
};
