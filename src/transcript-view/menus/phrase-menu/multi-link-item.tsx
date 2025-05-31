import { Item } from 'react-contexify';

import { getPhraseText, MenuAction, PhraseLink, PhraseRole } from '../../../shared/data';
import { useUserData } from '../../../context/user-data-context';
import { useTranscriptInteraction } from '../../../context/transcript-interaction-context';

interface MultiLinkItemProps {
  link: PhraseLink;
  role: PhraseRole;
}

export const MultiLinkItem: React.FC<MultiLinkItemProps> = ({ link, role }) => {
  const { transcriptLines } = useUserData();
  const { handlePhraseMenuAction } = useTranscriptInteraction();
  const roleStr = role === PhraseRole.Repetition ? 'rep' : 'src';
  const phraseText = getPhraseText(
    role === PhraseRole.Repetition ? link.structure.repetition : link.structure.sources[0],
    transcriptLines
  );

  return (
    <Item
      onMouseOver={() => handlePhraseMenuAction(link.structure.id, MenuAction.HoverStructure)}
      onMouseOut={() => handlePhraseMenuAction('', MenuAction.Unhover)}
      onClick={() => handlePhraseMenuAction(link.structure.id, MenuAction.Click)}
    >
      { roleStr }: { phraseText }
    </Item>
  );
};
