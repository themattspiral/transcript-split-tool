import { Item } from 'react-contexify';

import { getPhraseText, MenuAction, PhraseLink, PhraseRole, SpanType } from '../../../shared/data';
import { useUserData } from '../../../context/user-data-context';
import { useTranscriptInteraction } from '../../../context/transcript-interaction-context';
import { Badge } from '../../../shared/components/badge';
import { CurvedArrow } from '../../../shared/components/curved-arrow';
import { SimpleSpanBubble } from '../../../shared/components/simple-span-bubble';

interface MultiLinkItemProps {
  link: PhraseLink;
  role: PhraseRole;
  onMouseOverOut?: (isOver: boolean) => void;
}

export const MultiLinkItem: React.FC<MultiLinkItemProps> = ({ link, role, onMouseOverOut }) => {
  const { transcriptLines, topsDisplayNames } = useUserData();
  const { handleStructureSelectMenuAction } = useTranscriptInteraction();
  const phraseText = getPhraseText(
    role === PhraseRole.Repetition ? link.structure.repetition : link.structure.sources[0],
    transcriptLines
  );

  return (
    <Item
      onMouseOver={() => {
        handleStructureSelectMenuAction(link.structure.id, MenuAction.HoverStructure);
        if (onMouseOverOut) {
          onMouseOverOut(true);
        }
      }}
      onMouseOut={() => {
        handleStructureSelectMenuAction('', MenuAction.Unhover);
        if (onMouseOverOut) {
          onMouseOverOut(false);
        }
      }}
      onClick={() => handleStructureSelectMenuAction(link.structure.id, MenuAction.Click)}
    >
      <div className="w-full">

        <div className="flex justify-end w-full mb-1">
          <Badge>
            { topsDisplayNames[link.structure.topsId] }
          </Badge>
        </div>

        <div className="flex items-center">
          <CurvedArrow mode="phrase-link" direction={role === PhraseRole.Repetition ? 'up' : 'down'} />
          
          <Badge mode="line-number">
            { role === PhraseRole.Repetition ? link.structure.repetition.lineNumber : link.structure.sources[0].lineNumber }
          </Badge>
          
          <SimpleSpanBubble spanType={role === PhraseRole.Source ? SpanType.Source : SpanType.Repetition}>
            { phraseText }
          </SimpleSpanBubble>
        </div>

      </div>
    </Item>
  );
};
