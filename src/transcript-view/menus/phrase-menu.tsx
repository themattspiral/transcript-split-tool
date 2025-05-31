import { ReactElement, useMemo } from 'react';
import { Menu, Item, Separator } from 'react-contexify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPenToSquare } from '@fortawesome/free-solid-svg-icons';

import './context-menu.css';
import { PHRASE_MENU_ID } from './context-menu';
import { getPhraseText, MenuAction, PhraseRole, PoeticStructureRelationshipType } from '../../shared/data';
import { useUserData } from '../../context/user-data-context';
import { useTranscriptInteraction } from '../../context/transcript-interaction-context';

export const PhraseMenu: React.FC = () => {
  const { transcriptLines, phraseLinks } = useUserData();
  const { contextPhraseIds, handleMenuAction } = useTranscriptInteraction();

  // Each phrase associated with the context-selected span:
  //   - overlapping sections of 2 or more overlapping phrases will result in each phrase being a separate
  //     context menu item (selectable combo item, or non-selectable header item and structure link items)
  const menuItems = useMemo(() => contextPhraseIds.flatMap((phraseId, phraseIdx) => {
    const info = phraseLinks[phraseId];

    if (info.links.length === 1) {
      // Single link - Single structure:
      //   - Make a single selectable item to represent it

      const link = info.links[0];

      return [
        <Item
          key={`${phraseId}-${link.role}-${link.structure.id}`}
          onMouseOver={() => handleMenuAction(link.structure.id, MenuAction.Hover)}
          onMouseOut={() => handleMenuAction(link.structure.id, MenuAction.Unhover)}
          onClick={() => handleMenuAction(link.structure.id, MenuAction.Click)}
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

        // add a separator after the item if we're not on the last phrase
        phraseIdx < (contextPhraseIds.length - 1) ? <Separator key={phraseIdx} /> : undefined
      ];
    } else if (info.links.length > 1) {
      // Multiple Links - Multiple structures:
      //   - When multiple links are present, it means the phrase is associated with multiple different 
      //     poetic structures, e.g. they share the same phrase for either a destination or source.
      //   - In this case, we create a non-selectable item (header) to represent the common phrase,
      //     and a selectable item for each structure linked to it.

      const unaryLinks = info?.links.filter(l => l.structure.relationshipType === PoeticStructureRelationshipType.Unary) || [];
      const repetitionLinks = info?.links.filter(l => {
        return l.role === PhraseRole.Repetition && l.structure.relationshipType !== PoeticStructureRelationshipType.Unary
      }) || [];
      const sourceLinks = info?.links.filter(l => {
        return l.role === PhraseRole.Source && l.structure.relationshipType !== PoeticStructureRelationshipType.Unary
      }) || [];

      const items: ReactElement[] = [];

      if (unaryLinks.length > 0) {
        unaryLinks.forEach((link, linkIdx) => {
          items.push(
            <Item
              key={`${phraseId}-${link.role}-${link.structure.id}`}
              onMouseOver={() => handleMenuAction(link.structure.id, MenuAction.Hover)}
              onMouseOut={() => handleMenuAction(link.structure.id, MenuAction.Unhover)}
              onClick={() => handleMenuAction(link.structure.id, MenuAction.Click)}
            >
              rep (u): { getPhraseText(link.structure.repetition, transcriptLines) }
            </Item>
          );

          if (repetitionLinks.length > 0 || sourceLinks.length > 0 || linkIdx < (unaryLinks.length - 1) || phraseIdx < (contextPhraseIds.length - 1)) {
            items.push(<Separator key={`${phraseIdx}-rep-separator`} />);
          }
        });
      }

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
              onMouseOver={() => handleMenuAction(link.structure.id, MenuAction.Hover)}
              onMouseOut={() => handleMenuAction(link.structure.id, MenuAction.Unhover)}
              onClick={() => handleMenuAction(link.structure.id, MenuAction.Click)}
            >
              src: { getPhraseText(link.structure.sources[0], transcriptLines) }
            </Item>
          );
        });

        if (sourceLinks.length > 0 || phraseIdx < (contextPhraseIds.length - 1)) {
          items.push(<Separator key={`${phraseIdx}-rep-separator`} />);
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
              onMouseOver={() => handleMenuAction(link.structure.id, MenuAction.Hover)}
              onMouseOut={() => handleMenuAction(link.structure.id, MenuAction.Unhover)}
              onClick={() => handleMenuAction(link.structure.id, MenuAction.Click)}
            >
              rep: { getPhraseText(link.structure.repetition, transcriptLines) }
            </Item>
          );
        });

        if (phraseIdx < contextPhraseIds.length - 1) {
          items.push(<Separator key={`${phraseIdx}-src-separator`} />);
        }
      }

      return items;
    }
  }), [contextPhraseIds, handleMenuAction, transcriptLines, phraseLinks]);

  return (
    <Menu id={PHRASE_MENU_ID} animation="slide" className="max-w-[400px] font-sans">
      <Item disabled style={{ opacity: 1 }} className="text-sm font-semibold">
        <FontAwesomeIcon icon={faPenToSquare} className="mr-1" /> Choose the Poetic Strcture to Edit:
      </Item>

      <Separator />

      { menuItems }

    </Menu>
  );
};
