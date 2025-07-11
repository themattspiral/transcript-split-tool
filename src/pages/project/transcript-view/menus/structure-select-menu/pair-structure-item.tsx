import { Submenu } from 'react-contexify';

import { getPhraseText, MenuAction, PhraseLink, PoeticStructureRelationshipType, SpanType } from 'data';
import { useProjectData } from 'context/project-data-context';
import { useTranscriptInteraction } from 'context/transcript-interaction-context';
import { CurvedArrow } from 'components/curved-arrow';
import { Badge } from 'components/badge';
import { SimpleSpanBubble } from 'components/simple-span-bubble';
import { StructureActionItems } from './structure-action-items';

interface PairStructureItemProps {
  link: PhraseLink;
}

export const PairStructureItem: React.FC<PairStructureItemProps> = ({ link }) => {
  const { topsMap } = useProjectData();
  const { selectedTranscript, handleStructureSelectMenuAction } = useTranscriptInteraction();

  return (
    <Submenu
      className="allow-small [&:not(:last-child)]:border-b-1 border-gray-300"
      onMouseOver={() => handleStructureSelectMenuAction(link.structure.id, MenuAction.HoverStructure)}
      onMouseOut={() => handleStructureSelectMenuAction('', MenuAction.Unhover)}
      label={
        <div className="w-full pt-[1px] pb-[1px]">

          <div className="flex justify-end w-full mb-[2px]">
            <Badge>
              { topsMap[link.structure.topsId].type.hierarchyDisplayName }
            </Badge>
          </div>

          { link.structure.relationshipType !== PoeticStructureRelationshipType.Unary &&
            <div className="flex items-center mb-[2px]">
              <Badge mode="line-number">{ link.structure.sources[0].lineNumber }</Badge>

              <SimpleSpanBubble mode="menu" spanType={SpanType.Source}>
                { getPhraseText(link.structure.sources[0], selectedTranscript?.lines) }
              </SimpleSpanBubble>
            </div>
          }

          <div className="flex items-center">
            { link.structure.relationshipType !== PoeticStructureRelationshipType.Unary && 
              <CurvedArrow mode="phrase-link" direction='down-right' />
            }
            
            <Badge mode="line-number">{ link.structure.repetition.lineNumber }</Badge>
            
            <SimpleSpanBubble mode="menu" spanType={SpanType.Repetition}>
              { getPhraseText(link.structure.repetition, selectedTranscript?.lines) }
            </SimpleSpanBubble>
          </div>
          
        </div>
    }>

      <StructureActionItems link={link} />
    
    </Submenu>
  );
};
