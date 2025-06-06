import { Item } from 'react-contexify';

import { getPhraseText, MenuAction, PhraseLink, SpanType } from '../../../shared/data';
import { useUserData } from '../../../context/user-data-context';
import { useTranscriptInteraction } from '../../../context/transcript-interaction-context';
import { SimpleSpanBubble } from '../../../shared/components/simple-span-bubble';

interface UnaryItemProps {
  link: PhraseLink;
}

export const UnaryItem: React.FC<UnaryItemProps> = ({ link }) => {
  const { transcriptLines } = useUserData();
  const { handleStructureSelectMenuAction } = useTranscriptInteraction();

  return (
    <Item
      onMouseOver={() => handleStructureSelectMenuAction(link.structure.id, MenuAction.HoverStructure)}
      onMouseOut={() => handleStructureSelectMenuAction('', MenuAction.Unhover)}
      onClick={() => handleStructureSelectMenuAction(link.structure.id, MenuAction.Click)}
    >
      <div>
        <SimpleSpanBubble mode="menu" spanType={SpanType.Repetition}>
          [U] { getPhraseText(link.structure.repetition, transcriptLines) }
        </SimpleSpanBubble>
      </div>
    </Item>
  );
};
