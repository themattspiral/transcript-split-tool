import { ReactElement, useMemo } from 'react';
import { Menu, Item, Separator } from 'react-contexify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPenToSquare } from '@fortawesome/free-solid-svg-icons';

import './context-menu.css';
import { PHRASE_MENU_ID } from './context-menu';
import { getPhraseText, PhraseRole, PoeticStructureRelationshipType } from '../../shared/data';
import { useUserData } from '../../context/user-data-context';
import { useStructureEdit } from '../../context/structure-edit-context';
import { useTranscriptInteraction } from '../../context/transcript-interaction-context';

export const PhraseMenu: React.FC = () => {
  const { transcriptLines, phraseLinks } = useUserData();
  const { contextPhraseIds } = useTranscriptInteraction();
  const { beginEdit } = useStructureEdit();

  // Each phrase associated with the context-selected span:
  //   - overlapping sections of 2 or more overlapping phrases will result in each phrase being a separate
  //     context menu item (selectable combo item, or non-selectable header item and structure link items)
  const menuItems = useMemo(() => contextPhraseIds.flatMap((phraseId, idx) => {
    const info = phraseLinks[phraseId];

    if (info.links.length === 1) {
      // Single link - Single structure:
      //   - Make a single selectable item to represent it
      const link = info.links[0];

      return [
        <Item
          key={`${phraseId}-${link.role}-${link.structure.id}`}
          onClick={() => {
            beginEdit(link.structure.id);
          }}
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
        </Item>,
        idx < (contextPhraseIds.length - 1) ? <Separator key={idx} /> : undefined
      ];
    } else if (info.links.length > 1) {
      // Multiple Links - Multiple structures:
      //   - When multiple links are present, it means the phrase is associated with multiple different 
      //     poetic structures, e.g. they share the same phrase for either a destination or source.
      //   - In this case, we create a non-selectable item (header) to represent the common phrase,
      //     and a selectable item for each structure linked to it.
      const repetitionLinks = info?.links.filter(l => {
        return l.role === PhraseRole.Repetition && l.structure.relationshipType !== PoeticStructureRelationshipType.Unary
      }) || [];
      const sourceLinks = info?.links.filter(l => {
        return l.role === PhraseRole.Source && l.structure.relationshipType !== PoeticStructureRelationshipType.Unary
      }) || [];
      const unaryLinks = info?.links.filter(l => l.structure.relationshipType === PoeticStructureRelationshipType.Unary) || [];

      const items: ReactElement[] = [];

      if (repetitionLinks.length > 0) {
        items.push(
          <Item disabled style={{ opacity: 1 }} className="header" key={`${phraseId}-rep-header`}>
            rep: { getPhraseText(info.phrase, transcriptLines) }
          </Item>
        );

        repetitionLinks.forEach(link => {
          items.push(
            <Item
              key={`${phraseId}-${link.role}-${link.structure.id}`}
              onClick={() => {
                beginEdit(link.structure.id);
              }}
            >
              src: { getPhraseText(link.structure.sources[0], transcriptLines) }
            </Item>
          );
        });

        if (sourceLinks.length > 0 || idx < (contextPhraseIds.length - 1)) {
          items.push(<Separator key={idx} />);
        }
      }

      if (sourceLinks.length > 0) {
        items.push(
          <Item disabled style={{ opacity: 1 }} className="header" key={`${phraseId}-src-header`}>
            src: { getPhraseText(info.phrase, transcriptLines) }
          </Item>
        );

        sourceLinks.forEach(link => {
          items.push(
            <Item
              key={`${phraseId}-${link.role}-${link.structure.id}`}
              onClick={() => {
                beginEdit(link.structure.id);
              }}
            >
              rep: { getPhraseText(link.structure.repetition, transcriptLines) }
            </Item>
          );
        });

        if (idx < contextPhraseIds.length - 1) {
          items.push(<Separator key={idx} />);
        }
      }

      return items;
    }
  }), [contextPhraseIds, beginEdit, transcriptLines, phraseLinks]);

  return (
    <Menu id={PHRASE_MENU_ID} animation="slide" className="max-w-[400px] font-sans">
      <Item disabled style={{ opacity: 1 }} className="text-xs">
        <FontAwesomeIcon icon={faPenToSquare} className="mr-1" /> Edit Poetic Strcture
      </Item>

      <Separator />

      { menuItems }

    </Menu>
  );
};
