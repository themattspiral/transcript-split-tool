import { ReactElement, useMemo } from 'react';
import { Menu, Item, Separator } from 'react-contexify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPenToSquare } from '@fortawesome/free-solid-svg-icons';

import { TranscriptMenuId } from '../transcript-menus';
import { PhraseRole, PoeticStructureRelationshipType, sortPhrases } from '../../../shared/data';
import { useUserData } from '../../../context/user-data-context';
import { useTranscriptInteraction } from '../../../context/transcript-interaction-context';
import { EditItem } from './edit-item';
import { SingleLinkItem } from './single-link-item';
import { UnaryItem } from './unary-item';
import { MultiLinkHeaderItem } from './multi-link-header-item';
import { MultiLinkItem } from './multi-link-item';

// allows users to choose which poetic structure to edit,
// from those associated with the context-clicked span bubble
export const StructureSelectMenu: React.FC = () => {
  const { phraseLinks } = useUserData();
  const {
    contextPhraseIds, updateMenuVisibility, multiLinkHeaderHoveredKey, setMultiLinkHeaderHoveredKey
  } = useTranscriptInteraction();

  const menuItems = useMemo(() => {
    const items: ReactElement[] = [];

    if (contextPhraseIds.length === 1 && phraseLinks[contextPhraseIds[0]]?.links?.length === 1) {
      // single-phrase, single-link: just show edit menu item
      items.push(
        <EditItem key="lone-edit-item" link={phraseLinks[contextPhraseIds[0]]?.links[0]} />
      );
    } else {
      // multiple phrases, or multiple links - user must make a choice
      items.push(
        <Item key="menu-header" disabled style={{ opacity: 1 }} className="text-sm font-medium border-b-1 border-gray-500 mb-2">
          <FontAwesomeIcon icon={faPenToSquare} className="mr-1" size="lg" /> Choose the Poetic Strcture to Edit:
        </Item>
      );

      // generate menu items based on the context phrases specified, and their links
      contextPhraseIds.forEach((contextPhraseId, contextPhraseIdx) => {
        const info = phraseLinks[contextPhraseId];

        if (info.links.length === 1) {
          // single link: make a single selectable item to represent the structure
          const link = info.links[0];
          items.push(
            <SingleLinkItem key={`${contextPhraseId}-${link.role}-${link.structure.id}`} link={link} />
          );

          // add a separator after the item if we're not on the last phrase
          if (contextPhraseIdx < (contextPhraseIds.length - 1)) {
            items.push(<Separator key={`${contextPhraseIdx}-separator`} />);
          }
        } else if (info.links.length > 1) {
          // multiple links: the context phrase is associated with multiple different poetic structures,
          //                 which share this same phrase for either a destination or source

          // group links by the role the context phrase plays in the structure
          const unaryLinks = info.links.filter(l => l.structure.relationshipType === PoeticStructureRelationshipType.Unary);
          const repetitionLinks = info.links
            .filter(l => {
              return l.role === PhraseRole.Repetition && l.structure.relationshipType !== PoeticStructureRelationshipType.Unary
            })
            .sort((a, b) => sortPhrases(a.structure.sources[0], b.structure.sources[0]));
          const sourceLinks = info.links
            .filter(l => {
              return l.role === PhraseRole.Source && l.structure.relationshipType !== PoeticStructureRelationshipType.Unary
            })
            .sort((a, b) => sortPhrases(a.structure.repetition, b.structure.repetition));

          // unary links
          if (unaryLinks.length > 0) {
            unaryLinks.forEach((link, linkIdx) => {
              items.push(
                <UnaryItem key={`${contextPhraseId}-${link.role}-${link.structure.id}`} link={link} />
              );

              if (
                repetitionLinks.length > 0 || sourceLinks.length > 0
                || linkIdx < (unaryLinks.length - 1) || contextPhraseIdx < (contextPhraseIds.length - 1)
              ) {
                items.push(<Separator key={`${contextPhraseIdx}-unary-separator`} />);
              }
            });
          }

          if (repetitionLinks.length === 1) {
            const link = repetitionLinks[0];
            items.push(
              <SingleLinkItem key={`${contextPhraseId}-${link.role}-${link.structure.id}`} link={link} />
            );
          } else if (repetitionLinks.length > 1) {
            // create a non-selectable item (header) to represent the common repetition
            const headerKey = `${contextPhraseId}-rep-header`;
            items.push(
              <MultiLinkHeaderItem
                key={headerKey} contextPhrase={info.phrase} role={PhraseRole.Repetition}
                hovered={multiLinkHeaderHoveredKey === headerKey}
              />
            );
            
            // create a selectable item for each structure linked, displayed as the differing sources
            repetitionLinks.forEach(link => {
              items.push(
                <MultiLinkItem
                  key={`${contextPhraseId}-src-${link.structure.id}`} link={link} role={PhraseRole.Source}
                  onMouseOverOut={isOver => setMultiLinkHeaderHoveredKey(isOver ? headerKey : null)}
                />
              );
            });
          }

          if (
            repetitionLinks.length > 0 &&
            (sourceLinks.length > 0 || contextPhraseIdx < (contextPhraseIds.length - 1))
          ) {
              items.push(<Separator key={`${contextPhraseIdx}-rep-separator`} />);
          }

          if (sourceLinks.length === 1) {
            const link = repetitionLinks[0];
            items.push(
              <SingleLinkItem key={`${contextPhraseId}-${link.role}-${link.structure.id}`} link={link} />
            );
          } else if (sourceLinks.length > 1) {
            // create a non-selectable item (header) to represent the common source
            const headerKey = `${contextPhraseId}-src-header`;
            items.push(
              <MultiLinkHeaderItem
                key={headerKey} contextPhrase={info.phrase} role={PhraseRole.Source}
                hovered={multiLinkHeaderHoveredKey === headerKey}
              />
            );

            // create a selectable item for each structure linked, displayed as the differing repetitions
            sourceLinks.forEach(link => {
              items.push(
                <MultiLinkItem
                  key={`${contextPhraseId}-rep-${link.structure.id}`} link={link} role={PhraseRole.Repetition}
                  onMouseOverOut={isOver => setMultiLinkHeaderHoveredKey(isOver ? headerKey : null)}
                />
              );
            });

            if (sourceLinks.length > 0 && contextPhraseIdx < contextPhraseIds.length - 1) {
              items.push(<Separator key={`${contextPhraseIdx}-src-separator`} />);
            }
          }
        }
      });
    }

    return items;
  }, [contextPhraseIds, phraseLinks, multiLinkHeaderHoveredKey, setMultiLinkHeaderHoveredKey]);

  return (
    <Menu
      id={TranscriptMenuId.StructureSelectMenu}
      animation="slide"
      className="max-w-[400px] font-sans text-sm"
      onVisibilityChange={isVisible => updateMenuVisibility(TranscriptMenuId.StructureSelectMenu, isVisible)}
    >

      { menuItems }

    </Menu>
  );
};
