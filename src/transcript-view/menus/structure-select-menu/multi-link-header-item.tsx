import { CSSProperties } from 'react';
import { Item } from 'react-contexify';

import { getPhraseText, MenuAction, Phrase, PhraseRole, SpanType } from '../../../shared/data';
import { useUserData } from '../../../context/user-data-context';
import { useTranscriptInteraction } from '../../../context/transcript-interaction-context';
import { useViewState } from '../../../context/view-state-context';
import { CustomCSSVariables } from '../../../context/view-state-provider';
import { SimpleSpanBubble } from '../../../shared/components/simple-span-bubble';

interface MultiLinkHeaderItemProps {
  contextPhrase: Phrase;
  role: PhraseRole;
  hovered?: boolean;
}

export const MultiLinkHeaderItem: React.FC<MultiLinkHeaderItemProps> = ({ contextPhrase, role, hovered = false }) => {
  const { cssVariables } = useViewState();
  const { transcriptLines } = useUserData();
  const { handleStructureSelectMenuAction } = useTranscriptInteraction();

  const itemStyles: CSSProperties = { opacity: 1 };
  if (hovered) {
    itemStyles.backgroundColor = cssVariables[CustomCSSVariables.MenuActiveBgColor];
  }

  return (
    <Item
      disabled
      className="header rounded-[4px]"
      style={itemStyles}
      onMouseOver={() => handleStructureSelectMenuAction(contextPhrase.id, MenuAction.HoverPhrase)}
      onMouseOut={() => handleStructureSelectMenuAction('', MenuAction.Unhover)}
    >
      <div className="flex items-center">
        <SimpleSpanBubble spanType={role === PhraseRole.Source ? SpanType.Source : SpanType.Repetition}>
          { getPhraseText(contextPhrase, transcriptLines) }
        </SimpleSpanBubble>
      </div>
    </Item>
  );
};
