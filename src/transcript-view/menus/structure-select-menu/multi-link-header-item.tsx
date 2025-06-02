import { CSSProperties } from 'react';
import { Item } from 'react-contexify';

import { getPhraseText, MenuAction, Phrase, PhraseRole } from '../../../shared/data';
import { useUserData } from '../../../context/user-data-context';
import { useTranscriptInteraction } from '../../../context/transcript-interaction-context';
import { RepetitionClasses, SourceClasses } from '../transcript-menus';
import { useViewState } from '../../../context/view-state-context';
import { CustomCSSVariables } from '../../../context/view-state-provider';

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
        <span className={role === PhraseRole.Repetition ? RepetitionClasses : SourceClasses}>
          { getPhraseText(contextPhrase, transcriptLines) }
        </span>
      </div>
    </Item>
  );
};
