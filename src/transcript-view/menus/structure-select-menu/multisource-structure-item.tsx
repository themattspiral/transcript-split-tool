import { Submenu } from 'react-contexify';

import { getPhraseText, MenuAction, PhraseLink, PoeticStructureRelationshipType, SpanType } from '../../../shared/data';
import { useUserData } from '../../../context/user-data-context';
import { useTranscriptInteraction } from '../../../context/transcript-interaction-context';
import { CurvedArrow } from '../../../shared/components/curved-arrow';
import { Badge } from '../../../shared/components/badge';
import { SimpleSpanBubble } from '../../../shared/components/simple-span-bubble';
import { StructureActionItems } from './structure-action-items';

interface MultisourceStructureItemProps {
  link: PhraseLink;
}

export const MultisourceStructureItem: React.FC<MultisourceStructureItemProps> = ({ link }) => {
  const { transcriptLines, topsMap } = useUserData();
  const { handleStructureSelectMenuAction } = useTranscriptInteraction();

  return (
    <Submenu
      className="allow-small [&:not(:last-child)]:border-b-1 border-gray-300"
      onMouseOver={() => handleStructureSelectMenuAction(link.structure.id, MenuAction.HoverStructure)}
      onMouseOut={() => handleStructureSelectMenuAction('', MenuAction.Unhover)}
      label={
        <div className="w-full pt-[1px] pb-[1px]">

          <div className="flex justify-end w-full mb-[2px]">
            <Badge>
              { topsMap[link.structure.topsId].type.displayName }
            </Badge>
          </div>

          <div className="flex flex-wrap gap-1">
            { link.structure.sources.map(source => (
              <div key={source.id} className="flex items-center mb-[2px]">
                <Badge className="shrink-0" mode="line-number">{ source.lineNumber }</Badge>

                <SimpleSpanBubble className="text-ellipsis overflow-hidden" mode="menu" spanType={SpanType.Source}>
                  { getPhraseText(source, transcriptLines) }
                </SimpleSpanBubble>
              </div>
            )) }
          </div>
            
          <div className="flex items-center">
            { link.structure.relationshipType !== PoeticStructureRelationshipType.Unary && 
              <CurvedArrow mode="phrase-link" direction='down-right' />
            }
            
            <Badge mode="line-number">{ link.structure.repetition.lineNumber }</Badge>
            
            <SimpleSpanBubble mode="menu" spanType={SpanType.Repetition}>
              { getPhraseText(link.structure.repetition, transcriptLines) }
            </SimpleSpanBubble>
          </div>
          
        </div>
    }>

      <StructureActionItems link={link} />
    
    </Submenu>
  );
};
