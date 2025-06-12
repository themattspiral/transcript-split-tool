import { Submenu } from 'react-contexify';

import { getPhraseText, MenuAction, PhraseLink, SpanType } from '../../../shared/data';
import { useUserData } from '../../../context/user-data-context';
import { useTranscriptInteraction } from '../../../context/transcript-interaction-context';
import { SimpleSpanBubble } from '../../../shared/components/simple-span-bubble';
import { StructureActionItems } from './structure-action-items';
import { Badge } from '../../../shared/components/badge';

interface UnaryStructureItemProps {
  link: PhraseLink;
}

export const UnaryStructureItem: React.FC<UnaryStructureItemProps> = ({ link }) => {
  const { transcriptLines, topsMap } = useUserData();
  const { handleStructureSelectMenuAction } = useTranscriptInteraction();

  return (
    <Submenu
      className="[&:not(:last-child)]:border-b-1 border-gray-300"
      onMouseOver={() => handleStructureSelectMenuAction(link.structure.id, MenuAction.HoverStructure)}
      onMouseOut={() => handleStructureSelectMenuAction('', MenuAction.Unhover)}
      label={
        <div className="w-full pt-[1px] pb-[1px]">
          <div className="flex justify-end w-full mb-[2px]">
            <Badge>
              { topsMap[link.structure.topsId].type.hierarchyDisplayName }
            </Badge>
          </div>

          <div className="flex items-center">
            <Badge className="shrink-0" mode="line-number">{ link.structure.repetition.lineNumber }</Badge>
            
            <SimpleSpanBubble mode="menu" spanType={SpanType.Repetition}>
              { getPhraseText(link.structure.repetition, transcriptLines) }
            </SimpleSpanBubble>
          </div>
        </div>
      }
    >

      <StructureActionItems link={link} />

    </Submenu>
  );
};
