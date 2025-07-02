import { ReactElement, useMemo } from 'react';
import { Menu, Item } from 'react-contexify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPenToSquare } from '@fortawesome/free-solid-svg-icons';

import { PoeticStructureRelationshipType } from 'data';
import { useProjectData } from 'context/project-data-context';
import { useTranscriptInteraction } from 'context/transcript-interaction-context';
import { StructureActionItems } from './structure-action-items';
import { TranscriptMenuId } from '../transcript-menus';
import { PairStructureItem } from './pair-structure-item';
import { UnaryStructureItem } from './unary-structure-item';
import { MultisourceStructureItem } from './multisource-structure-item';

const HEADER = (
  <Item
    key="menu-header" disabled style={{ opacity: 1 }}
    className="menu-header bg-gray-200 px-1 pt-[3px] pb-[2px] border-b-1 border-gray-500 mb-2 text-gray-600 text-sm font-medium"
  >
    <div className="w-full flex justify-end items-center">
      Choose Poetic Strcture
      <FontAwesomeIcon icon={faPenToSquare} className="ml-1" size="sm" />
    </div>
  </Item>
);

// allows users to choose which poetic structure to edit,
// from those associated with the context-clicked span bubble
export const StructureSelectMenu: React.FC = () => {
  const { phraseLinks } = useProjectData();
  const { contextPhraseIds, updateMenuVisibility } = useTranscriptInteraction();

  const singlePhrase = contextPhraseIds.length === 1;
  const singleLink = phraseLinks[contextPhraseIds[0]]?.links?.length === 1;

  const menuItems = useMemo(() => {
    const items: ReactElement[] = [];

    if (singlePhrase && singleLink) {
      // single-phrase, single-link: just show edit menu item
      items.push(<StructureActionItems key="action-items" link={phraseLinks[contextPhraseIds[0]]?.links[0]} />);
    } else {
      // multiple phrases, or multiple links - user must make a choice
      items.push(HEADER);

      // generate menu items based on the context phrases specified, and their links
      contextPhraseIds.forEach(contextPhraseId => {
        phraseLinks[contextPhraseId]?.links.forEach(link => {
          if (link.structure.relationshipType === PoeticStructureRelationshipType.Unary) {
            items.push(<UnaryStructureItem key={`${contextPhraseId}-${link.role}-${link.structure.id}`} link={link} />);
          } else if (link.structure.relationshipType === PoeticStructureRelationshipType.Paired) {
            items.push(<PairStructureItem key={`${contextPhraseId}-${link.role}-${link.structure.id}`} link={link} />);
          } else if (link.structure.relationshipType === PoeticStructureRelationshipType.MultipleSource) {
            items.push(<MultisourceStructureItem key={`${contextPhraseId}-${link.role}-${link.structure.id}`} link={link} />);
          }
        });
      });
    }

    return items;
  }, [contextPhraseIds, phraseLinks]);

  return menuItems.length === 0 ? null : (
    <Menu
      id={TranscriptMenuId.StructureSelectMenu}
      animation="slide"
      className="max-w-[400px] font-sans text-sm allow-small"
      onVisibilityChange={isVisible => updateMenuVisibility(TranscriptMenuId.StructureSelectMenu, isVisible)}
    >

      { menuItems }

    </Menu>
  );
};
