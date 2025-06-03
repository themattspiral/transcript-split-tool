import { Item } from 'react-contexify';

import { getPhraseText, MenuAction, PhraseLink, PhraseRole, PoeticStructureRelationshipType, SpanType } from '../../../shared/data';
import { useUserData } from '../../../context/user-data-context';
import { useTranscriptInteraction } from '../../../context/transcript-interaction-context';
import { CurvedArrow } from '../../../shared/components/curved-arrow';
import { Badge } from '../../../shared/components/badge';
import { SimpleSpanBubble } from '../../../shared/components/simple-span-bubble';

interface SingleLinkItemProps {
  link: PhraseLink;
}

export const SingleLinkItem: React.FC<SingleLinkItemProps> = ({ link }) => {
  const { transcriptLines, topsDisplayNames } = useUserData();
  const { handleStructureSelectMenuAction } = useTranscriptInteraction();

  return (
    <Item
      onMouseOver={() => handleStructureSelectMenuAction(link.structure.id, MenuAction.HoverStructure)}
      onMouseOut={() => handleStructureSelectMenuAction('', MenuAction.Unhover)}
      onClick={() => handleStructureSelectMenuAction(link.structure.id, MenuAction.Click)}
    >
      { link.role === PhraseRole.Repetition && 
        <div className="w-full">

          <div className="flex justify-end w-full mb-1">
            <Badge>
              { topsDisplayNames[link.structure.topsId] }
            </Badge>
          </div>

          <div className="flex items-center">
            <SimpleSpanBubble mode='menu' spanType={SpanType.Repetition}>
              { getPhraseText(link.structure.repetition, transcriptLines) }
            </SimpleSpanBubble>
          </div>

          { link.structure.relationshipType !== PoeticStructureRelationshipType.Unary &&
            <div className="flex items-center mt-1">
              <CurvedArrow mode="phrase-link" direction='down' />

              <Badge mode='line-number'>{ link.structure.sources[0].lineNumber }</Badge>
              
              <SimpleSpanBubble mode='menu' spanType={SpanType.Source}>
                { getPhraseText(link.structure.sources[0], transcriptLines) }
              </SimpleSpanBubble>
            </div>
          }

        </div>
      }
      { link.role === PhraseRole.Source && 
        <div className="w-full">
          <div className="flex justify-end w-full mb-1">
            <Badge>
              { topsDisplayNames[link.structure.topsId] }
            </Badge>
          </div>

          { link.structure.relationshipType !== PoeticStructureRelationshipType.Unary &&
            <div className="flex items-center mb-1">
              <SimpleSpanBubble mode='menu' spanType={SpanType.Source}>
                { getPhraseText(link.structure.sources[0], transcriptLines) }
              </SimpleSpanBubble>
            </div>
          }

          <div className="flex items-center">
            { link.structure.relationshipType !== PoeticStructureRelationshipType.Unary && 
              <CurvedArrow mode="phrase-link" direction='up' />
            }
            
            <Badge mode='line-number'>{ link.structure.repetition.lineNumber }</Badge>
            
            <SimpleSpanBubble mode='menu' spanType={SpanType.Repetition}>
              { getPhraseText(link.structure.repetition, transcriptLines) }
            </SimpleSpanBubble>
          </div>
        </div>
      }
    </Item>
  );
};
