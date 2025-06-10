import { ReactElement, useMemo } from 'react';
import { Menu, Item } from 'react-contexify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPenToSquare } from '@fortawesome/free-solid-svg-icons';

import { TranscriptMenuId } from '../transcript-menus';
import { PoeticStructureRelationshipType } from '../../../shared/data';
import { useUserData } from '../../../context/user-data-context';
import { useTranscriptInteraction } from '../../../context/transcript-interaction-context';
import { EditItem } from './edit-item';
import { SingleLinkItem } from './single-link-item';
import { UnaryItem } from './unary-item';

// allows users to choose which poetic structure to edit,
// from those associated with the context-clicked span bubble
export const StructureSelectMenu: React.FC = () => {
  const { phraseLinks } = useUserData();
  const { contextPhraseIds, updateMenuVisibility } = useTranscriptInteraction();

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

      // generate menu items based on the context phrases specified, and their links
      contextPhraseIds.forEach(contextPhraseId => {
        const info = phraseLinks[contextPhraseId];

        if (!info || info.links.length === 0) {
          return;
        }

        info.links.map(link => {
          if (link.structure.relationshipType === PoeticStructureRelationshipType.Unary) {
            items.push(<UnaryItem key={`${contextPhraseId}-${link.role}-${link.structure.id}`} link={link} />);
          } else {
            items.push(<SingleLinkItem key={`${contextPhraseId}-${link.role}-${link.structure.id}`} link={link} />);
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
      className="max-w-[400px] font-sans text-sm"
      onVisibilityChange={isVisible => updateMenuVisibility(TranscriptMenuId.StructureSelectMenu, isVisible)}
    >

      { menuItems }

    </Menu>
  );
};
