import { Item } from 'react-contexify';

import { getPhraseText, MenuAction, PhraseLink, PhraseRole } from '../../../shared/data';
import { useUserData } from '../../../context/user-data-context';
import { useTranscriptInteraction } from '../../../context/transcript-interaction-context';
import { RepetitionClasses, SourceClasses } from '../transcript-menus';
import { Badge } from '../../../shared/components/badge';
import { CurvedArrow } from '../../../shared/components/curved-arrow';

interface MultiLinkItemProps {
  link: PhraseLink;
  role: PhraseRole;
  onMouseOverOut?: (isOver: boolean) => void;
}

export const MultiLinkItem: React.FC<MultiLinkItemProps> = ({ link, role, onMouseOverOut }) => {
  const { transcriptLines, topsDisplayNames } = useUserData();
  const { handlePhraseMenuAction } = useTranscriptInteraction();
  const phraseText = getPhraseText(
    role === PhraseRole.Repetition ? link.structure.repetition : link.structure.sources[0],
    transcriptLines
  );

  return (
    <Item
      onMouseOver={() => {
        handlePhraseMenuAction(link.structure.id, MenuAction.HoverStructure);
        if (onMouseOverOut) {
          onMouseOverOut(true);
        }
      }}
      onMouseOut={() => {
        handlePhraseMenuAction('', MenuAction.Unhover);
        if (onMouseOverOut) {
          onMouseOverOut(false);
        }
      }}
      onClick={() => handlePhraseMenuAction(link.structure.id, MenuAction.Click)}
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
          
          <span className={role === PhraseRole.Repetition ? RepetitionClasses : SourceClasses}>
            { phraseText }
          </span>
        </div>

      </div>
    </Item>
  );
};
