import { Item } from 'react-contexify';

import { getPhraseText, MenuAction, Phrase, PhraseRole } from '../../../shared/data';
import { useUserData } from '../../../context/user-data-context';
import { useTranscriptInteraction } from '../../../context/transcript-interaction-context';

interface MultiLinkHeaderItemProps {
  contextPhrase: Phrase;
  role: PhraseRole;
}

export const MultiLinkHeaderItem: React.FC<MultiLinkHeaderItemProps> = ({ contextPhrase, role }) => {
  const { transcriptLines } = useUserData();
  const { handlePhraseMenuAction } = useTranscriptInteraction();
  const roleStr = role === PhraseRole.Repetition ? 'rep' : 'src';

  return (
    <Item
      disabled
      style={{ opacity: 1 }}
      className="header"
      onMouseOver={() => handlePhraseMenuAction(contextPhrase.id, MenuAction.HoverPhrase)}
      onMouseOut={() => handlePhraseMenuAction('', MenuAction.Unhover)}
    >
      {roleStr}: { getPhraseText(contextPhrase, transcriptLines) }
    </Item>
  );
};
