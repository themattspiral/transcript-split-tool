import { Fragment } from 'react';
import { Menu, Item, Separator, Submenu } from 'react-contexify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPenToSquare } from '@fortawesome/free-solid-svg-icons';

import './context-menu.css';
import { getPhraseText, PhraseRole } from '../../shared/data';
import { useUserData } from '../../context/user-data-context';
import { useStructureEdit } from '../../context/structure-edit-context';
import { useTranscriptInteraction } from '../../context/transcript-interaction-context';

export const PHRASE_MENU_ID = 'phrase-menu-id';

export const PhraseMenu: React.FC = () => {
  const { transcriptLines, phraseLinks } = useUserData();
  const { contextPhraseIds } = useTranscriptInteraction();
  const { beginEdit } = useStructureEdit();

  // Each phrase associated with the context-selected span:
  //   - overlapping sections of 2 or more overlapping phrases will result in each phrase 
  //     being a separate context menu item (selectable combo, or non-selectable header, see below)
  const text = contextPhraseIds.map(phraseId => {
    const info = phraseLinks[phraseId];

    // Single link - Single structure:
    //   - Make a single selectable item to represent it

    // Multiple Links - Multiple structures:
    //   - When multiple links are present, it means the phrase is associated with multiple different 
    //     poetic structures, e.g. they share the same phrase for a destination or source
    //   - In this case, we create a non-selectable item (header) to represent the common phrase,
    //     and a selectable item for each structure linked to it
  });

  return (
    <Menu id={PHRASE_MENU_ID} animation="slide" className="max-w-[400px] font-sans">
      <div className="text-xs">Edit Poetic Strcture:</div>

      { contextPhraseIds.map((phraseId, idx) => {
        const info = phraseLinks[phraseId];
        const repetitionLinks = info?.links.filter(l => l.role === PhraseRole.Repetition) || [];
        const sourceLinks = info?.links.filter(l => l.role === PhraseRole.Source) || [];

        return (
          <Fragment key={phraseId}>
          { repetitionLinks.length > 0 &&
            <Fragment key={`${phraseId}-repetitions`}>
            <Item disabled style={{ opacity: 1 }}>
              <div className="font-bold font-mono flex whitespace-normal">
                (rep) { getPhraseText(info.phrase, transcriptLines) }
              </div>
            </Item>

            <Separator />

            { repetitionLinks.map(link => (
              <Item
                key={`${phraseId}-repetitions-${link.structure.id}`}
                onClick={() => {
                  beginEdit(link.structure.id);
                }}
              >
                <div className="flex items-center">
                  <FontAwesomeIcon icon={faPenToSquare} className="mr-1" />
                  (src) { !link.structure.multipleSources && getPhraseText(link.structure.source, transcriptLines) }
                </div>
              </Item>
            ))}


            </Fragment>
          }

          { repetitionLinks.length > 0 && sourceLinks.length > 0 &&
            <Separator />
          }

          { sourceLinks.length > 0 &&
            <Fragment key={`${phraseId}-sources`}>
            <Item disabled style={{ opacity: 1 }}>
              <div className="font-bold font-mono flex whitespace-normal">
                (src) { getPhraseText(info.phrase, transcriptLines) }
              </div>
            </Item>

            <Separator />

            { sourceLinks.map(link => (
              <Item
                key={`${phraseId}-sources-${link.structure.id}`}
                onClick={() => {
                  beginEdit(link.structure.id);
                }}
              >
                <div className="flex items-center">
                  <FontAwesomeIcon icon={faPenToSquare} className="mr-1" />
                  (rep) { getPhraseText(link.structure.repetition, transcriptLines) }
                </div>
              </Item>
            ))}
            </Fragment>
          }

          { idx < (contextPhraseIds.length - 1) && <Separator /> }
          </Fragment>
        );
      }) }
    </Menu>
  );
};
