import { Submenu } from 'react-contexify';

import { getPhraseText, MenuAction, PhraseLink, SpanType } from '../../../shared/data';
import { useUserData } from '../../../context/user-data-context';
import { useTranscriptInteraction } from '../../../context/transcript-interaction-context';
import { SimpleSpanBubble } from '../../../shared/components/simple-span-bubble';
import { StructureActionItems } from './structure-action-items';

interface UnaryStructureItemProps {
  link: PhraseLink;
}

export const UnaryStructureItem: React.FC<UnaryStructureItemProps> = ({ link }) => {
  const { transcriptLines } = useUserData();
  const { handleStructureSelectMenuAction } = useTranscriptInteraction();

  return (
    <Submenu
      onMouseOver={() => handleStructureSelectMenuAction(link.structure.id, MenuAction.HoverStructure)}
      onMouseOut={() => handleStructureSelectMenuAction('', MenuAction.Unhover)}
      label={
        <div>
          <SimpleSpanBubble mode="menu" spanType={SpanType.Repetition}>
            [U] { getPhraseText(link.structure.repetition, transcriptLines) }
          </SimpleSpanBubble>
        </div>
      }
    >

      <StructureActionItems link={link} />

    </Submenu>
  );
};
