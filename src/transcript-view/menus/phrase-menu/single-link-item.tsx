import { Item } from 'react-contexify';

import { getPhraseText, MenuAction, PhraseLink, PhraseRole, PoeticStructureRelationshipType } from '../../../shared/data';
import { useUserData } from '../../../context/user-data-context';
import { useTranscriptInteraction } from '../../../context/transcript-interaction-context';
import { RepetitionClasses, SourceClasses } from '../transcript-menus';
import { CurvedArrow } from '../../../shared/components/curved-arrow';
import { Badge } from '../../../shared/components/badge';

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
          <div className="flex items-center">
            <span className={RepetitionClasses}>
              { getPhraseText(link.structure.repetition, transcriptLines) }
            </span>
          </div>

          { link.structure.relationshipType !== PoeticStructureRelationshipType.Unary &&
            <div className="flex items-center mt-1">
              <CurvedArrow mode="phrase-link" direction='down' />

              <Badge mode='line-number'>{ link.structure.sources[0].lineNumber }</Badge>
              
              <span className={SourceClasses}>
                { getPhraseText(link.structure.sources[0], transcriptLines) }
              </span>
            </div>
          }
        </div>
      }
      { link.role === PhraseRole.Source && 
        <div>
          { link.structure.relationshipType !== PoeticStructureRelationshipType.Unary &&
            <div className="flex items-center mb-1">
              <span className={SourceClasses}>
                { getPhraseText(link.structure.sources[0], transcriptLines) }
                </span>
            </div>
          }

          <div className="flex items-center">
            { link.structure.relationshipType !== PoeticStructureRelationshipType.Unary && 
              <CurvedArrow mode="phrase-link" direction='up' />
            }
            
            <Badge mode='line-number'>{ link.structure.repetition.lineNumber }</Badge>
            
            <span className={RepetitionClasses}>
              { getPhraseText(link.structure.repetition, transcriptLines) }
            </span>
          </div>
        </div>
      }
    </Item>
  );
};
