import { Item } from 'react-contexify';

import { getPhraseText, MenuAction, PhraseLink, PhraseRole, PoeticStructureRelationshipType } from '../../../shared/data';
import { useUserData } from '../../../context/user-data-context';
import { useTranscriptInteraction } from '../../../context/transcript-interaction-context';

interface SingleLinkItemProps {
  link: PhraseLink;
}

export const SingleLinkItem: React.FC<SingleLinkItemProps> = ({ link }) => {
  const { transcriptLines } = useUserData();
  const { handlePhraseMenuAction } = useTranscriptInteraction();

  return (
    <Item
      onMouseOver={() => handlePhraseMenuAction(link.structure.id, MenuAction.HoverStructure)}
      onMouseOut={() => handlePhraseMenuAction('', MenuAction.Unhover)}
      onClick={() => handlePhraseMenuAction(link.structure.id, MenuAction.Click)}
    >
      { link.role === PhraseRole.Repetition && 
        <div>
          <div>rep: { getPhraseText(link.structure.repetition, transcriptLines) }</div>

          { link.structure.relationshipType !== PoeticStructureRelationshipType.Unary &&
            <div>src: {  getPhraseText(link.structure.sources[0], transcriptLines) }</div>
          }
        </div>
      }
      { link.role === PhraseRole.Source && 
        <div>
          { link.structure.relationshipType !== PoeticStructureRelationshipType.Unary &&
            <div>src: {  getPhraseText(link.structure.sources[0], transcriptLines) }</div>
          }

          <div>rep: { getPhraseText(link.structure.repetition, transcriptLines) }</div>
        </div>
      }
    </Item>
  );
};
