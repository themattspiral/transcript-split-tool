import { Fragment } from 'react';
import { Menu, Item, Separator, Submenu } from 'react-contexify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPenToSquare } from "@fortawesome/free-solid-svg-icons";

import './context-menu.css';
import { getPhraseText, PhraseRole } from "../data/data";
import { useUserData } from "../context/UserDataContext";
import { useStructureEdit } from "../context/StructureEditContext";
import { useTranscriptInteraction } from "../context/TranscriptInteractionContext";

const PHRASE_EDIT_MENU_ID = 'phrase-edit-menu-id';

const PhraseEditMenu: React.FC = () => {
  const { transcriptLines, phraseLinks } = useUserData();
  const { contextPhraseIds } = useTranscriptInteraction();
  const { beginEdit } = useStructureEdit();

  return (
    <Menu id={PHRASE_EDIT_MENU_ID} animation="slide" className="max-w-[400px] font-sans">
      { contextPhraseIds.map((phraseId, idx) => {
        const info = phraseLinks[phraseId];
        const repetitionLinks = info?.links.filter(l => l.role === PhraseRole.Repetition) || [];
        const sourceLinks = info?.links.filter(l => l.role === PhraseRole.Source) || [];

        return (
          <>
          { repetitionLinks.length > 0 &&
            <Fragment key={`${phraseId}-repetitions`}>
            <Item disabled style={{ opacity: 1 }}>
              <div className="font-bold font-mono flex whitespace-normal">
                (rep) { getPhraseText(info.phrase, transcriptLines) }
              </div>
            </Item>

            <Separator />

            { repetitionLinks.map(link => (
              // <Submenu 
              //   key={`${phraseId}-repetitions-${link.structure.id}`}
              //   label={
              //     <div className="flex items-center">
              //       (src) { !link.structure.multipleSources && getPhraseText(link.structure.source, transcriptLines) }
              //     </div>
              // }>
              //   <Item onClick={() => {}}>
              //     <div className="flex items-center">
              //       <FontAwesomeIcon icon={faPenToSquare} className="mr-1" />
              //       Edit
              //     </div>
              //   </Item>
              // </Submenu>
              <Item
                key={`${phraseId}-repetitions-${link.structure.id}`}
                onClick={() => {
                  console.log('editing', link.structure.id)
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
              // <Submenu 
              //   key={`${phraseId}-sources-${link.structure.id}`}
              //   label={
              //     <div className="flex items-center">
              //       (rep) { getPhraseText(link.structure.repetition, transcriptLines) }
              //     </div>
              // }>
              //   <Item onClick={() => {}}>
              //     <div className="flex items-center">
              //       <FontAwesomeIcon icon={faPenToSquare} className="mr-1" />
              //       Edit
              //     </div>
              //   </Item>
              // </Submenu>
              <Item
                key={`${phraseId}-sources-${link.structure.id}`}
                onClick={() => {
                  console.log('editing', link.structure.id)
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
          </>
        );
      }) }
    </Menu>
  );
};

export { PHRASE_EDIT_MENU_ID, PhraseEditMenu };
