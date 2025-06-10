import { Item } from 'react-contexify';

import { getPhraseText, MenuAction, PhraseLink, PoeticStructureRelationshipType, SpanType } from '../../../shared/data';
import { useUserData } from '../../../context/user-data-context';
import { useTranscriptInteraction } from '../../../context/transcript-interaction-context';
import { CurvedArrow } from '../../../shared/components/curved-arrow';
import { Badge } from '../../../shared/components/badge';
import { SimpleSpanBubble } from '../../../shared/components/simple-span-bubble';

interface SingleLinkItemProps {
  link: PhraseLink;
}

export const SingleLinkItem: React.FC<SingleLinkItemProps> = ({ link }) => {
  const { transcriptLines, topsMap } = useUserData();
  const { handleStructureSelectMenuAction } = useTranscriptInteraction();

  return (
    <Item
      onMouseOver={() => handleStructureSelectMenuAction(link.structure.id, MenuAction.HoverStructure)}
      onMouseOut={() => handleStructureSelectMenuAction('', MenuAction.Unhover)}
      onClick={() => handleStructureSelectMenuAction(link.structure.id, MenuAction.Click)}
    >
      <div className="w-full pt-[1px] pb-[1px]">

        <div className="flex justify-end w-full mb-[2px]">
          <Badge>
            { topsMap[link.structure.topsId].type.displayName }
          </Badge>
        </div>

        { link.structure.relationshipType !== PoeticStructureRelationshipType.Unary &&
          <div className="flex items-center mb-[2px]">
            <Badge mode="line-number">{ link.structure.sources[0].lineNumber }</Badge>

            <SimpleSpanBubble mode="menu" spanType={SpanType.Source}>
              { getPhraseText(link.structure.sources[0], transcriptLines) }
            </SimpleSpanBubble>
          </div>
        }

        <div className="flex items-center">
          { link.structure.relationshipType !== PoeticStructureRelationshipType.Unary && 
            <CurvedArrow mode="phrase-link" direction='down-right' />
          }
          
          {}
          <Badge mode="line-number">{ link.structure.repetition.lineNumber }</Badge>
          
          <SimpleSpanBubble mode="menu" spanType={SpanType.Repetition}>
            { getPhraseText(link.structure.repetition, transcriptLines) }
          </SimpleSpanBubble>
        </div>
        
      </div>
    </Item>
  );
};
