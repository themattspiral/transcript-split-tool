import { useCallback, useEffect, useMemo, useState } from 'react';
import { useContextMenu } from 'react-contexify';

import { TranscriptInteractionContext } from './transcript-interaction-context';
import { MenuAction, Phrase, PhraseAction, PhraseRole, PhraseViewState } from '../shared/data';
import { useUserData } from './user-data-context';
import { useStructureEdit } from './structure-edit-context';
import { TranscriptMenuId } from '../transcript-view/menus/transcript-menus';

export const TranscriptInteractionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // a controllable view state for every phrase (all phrases defined in phraseLinks)
  const [phraseViewStates, setPhraseViewStates] = useState<{ [phraseId: string]: PhraseViewState }>({});
  // phrase ids associated with right-clicked span (all phrases associated via current poetic structures)
  const [contextPhraseIds, setContextPhraseIds] = useState<string[]>([]);
  // highlighted phrase when it is right-clicked
  const [highlightedPhrase, setHighlightedPhrase] = useState<Phrase | null>(null);
  // when a multilink menu item is hovered, it sets this key for the corresponding header to be hovered
  const [multiLinkHeaderHoveredKey, setMultiLinkHeaderHoveredKey] = useState<string | null>(null);

  const [lme, setLme] = useState<React.MouseEvent | null>(null);
  
  const [transcriptMenuVisibility, setTranscriptMenuVisibility] = useState<{ [key in TranscriptMenuId]: boolean }>({
    [TranscriptMenuId.StructureSelectMenu]: false,
    [TranscriptMenuId.HighlightMenu]: false,
    [TranscriptMenuId.ErrorMultipleLinesMenu]: false
  });

  const allTranscriptMenusClosed: boolean = useMemo(() => {
    return Object.values(transcriptMenuVisibility).every(m => m === false);
  }, [transcriptMenuVisibility]);

  const { phraseLinks, getAllLinkedPhraseIds, getAllStructurePhraseIds } = useUserData();
  const { setPendingPhrase, beginStructureEdit } = useStructureEdit();
  const { show: showContextMenu } = useContextMenu();

  // internal helper
  const updateAllPhrases = useCallback((fieldName: keyof PhraseViewState, value: boolean) => {
    setPhraseViewStates(pvs => {
      const updated = { ...pvs };
      Object.values(updated).forEach(pv => {
        pv[fieldName] = value;
      });
      return updated;
    });
  }, [setPhraseViewStates]);

  // internal helper
  const clearAllThenUpdatePhrases = useCallback((phraseIds: string[], fieldName: keyof PhraseViewState, value: boolean) => {
    setPhraseViewStates(pvs => {
      const updated = { ...pvs };
      
      // clear all
      Object.keys(updated).forEach(id => {
        updated[id][fieldName] = false;
      });
      
      // update specified
      phraseIds.forEach(id => {
        const p = updated[id];
        if (p) {
          p[fieldName] = value;
        }
      });
      return updated;
    });
  }, [setPhraseViewStates]);
  
  // internal helper
  const clearAllThenUpdateAndCounterupdatePhrases = useCallback((
    fieldsToClear: (keyof PhraseViewState)[],
    fieldsToUpdate: (keyof PhraseViewState)[],
    fieldsToCounterupdate: (keyof PhraseViewState)[],
    phraseIds: string[],
    valueForUpdate: boolean,
    valueForCounterpdate: boolean
  ) => {
    // for quick lookups later
    const idMap = {} as { [phraseId: string]: boolean };
    phraseIds.forEach(id => {
      idMap[id] = true
    });

    setPhraseViewStates(pvs => {
      const updated = { ...pvs };
            
      Object.keys(updated).forEach(id => {
        // clear (set to false) all specified fields on all phrases
        fieldsToClear.forEach(fieldName => {
          updated[id][fieldName] = false;
        });

        if (idMap[id]) {
          // update all specified fields for all specified phrases,
          fieldsToUpdate.forEach(fieldName => {
            updated[id][fieldName] = valueForUpdate;
          });
        } else {
          // counterupdate all specified fields **for all non-specified phrases** (counterupdate)
          fieldsToCounterupdate.forEach(fieldName => {
            updated[id][fieldName] = valueForCounterpdate;
          });
        }
      });

      phraseIds.forEach(id => {
        const p = updated[id];
        if (p) {
          fieldsToUpdate.forEach(fieldName => {
            p[fieldName] = valueForUpdate;
          });
        }
      });
      return updated;
    });
  }, [setPhraseViewStates]);

  const clearPhraseEmphasis = useCallback(() => {
    clearAllThenUpdateAndCounterupdatePhrases(['isEmphasized', 'isDeemphasized'], [], [], [], false, false);
  }, [clearAllThenUpdateAndCounterupdatePhrases]);

  const clearPhraseSelection = useCallback(() => {
    updateAllPhrases('isSelected', false);
  }, [updateAllPhrases]);

  const handlePhraseAction = useCallback((event: React.MouseEvent, phraseIds: string[], action: PhraseAction) => {
    switch (action) {
      case PhraseAction.Hover:
        // only update emphasis if no menus are currently showing
        if (allTranscriptMenusClosed) {
          clearAllThenUpdateAndCounterupdatePhrases(
            ['isEmphasized', 'isDeemphasized'], // clear
            ['isEmphasized'],                   // update
            ['isDeemphasized'],                 // counterupdate
            getAllLinkedPhraseIds(phraseIds),
            true,
            true
          );
        }
        break;
      case PhraseAction.Unhover:
        // only clear emphasis if no menus are currently showing
        if (allTranscriptMenusClosed) {
          clearPhraseEmphasis();
        }
        break;
      case PhraseAction.Click:
        // only process click if no menus are currently showing
        if (allTranscriptMenusClosed) {
          // toggle click state
          const currentState = phraseViewStates[phraseIds[0]].isSelected;
          clearAllThenUpdatePhrases(getAllLinkedPhraseIds(phraseIds), 'isSelected', !currentState);
        }
        break;
      case PhraseAction.Context:
        setContextPhraseIds(phraseIds);

        // handle opening another context menu while one is already open
        if (!allTranscriptMenusClosed) {
          clearAllThenUpdateAndCounterupdatePhrases(
            ['isEmphasized', 'isDeemphasized'], // clear
            ['isEmphasized'],                   // update
            ['isDeemphasized'],                 // counterupdate
            getAllLinkedPhraseIds(phraseIds),
            true,
            true
          );
        }

        showContextMenu({ event, id: TranscriptMenuId.StructureSelectMenu });
        setLme(event);
        break;
    }
  }, [
    phraseViewStates, allTranscriptMenusClosed, clearAllThenUpdateAndCounterupdatePhrases, clearAllThenUpdatePhrases, clearPhraseEmphasis,
    getAllLinkedPhraseIds, setPhraseViewStates, setContextPhraseIds, showContextMenu
  ]);

  const handleStructureSelectMenuAction = useCallback((structureOrPhraseId: string, action: MenuAction) => {
    switch (action) {
      case MenuAction.Click:
        clearPhraseEmphasis();
        beginStructureEdit(structureOrPhraseId);
        break;
      case MenuAction.HoverStructure:
        clearAllThenUpdateAndCounterupdatePhrases(
          ['isEmphasized', 'isDeemphasized'], // clear
          ['isEmphasized'],                   // update
          ['isDeemphasized'],                 // counterupdate
          getAllStructurePhraseIds(structureOrPhraseId),
          true,
          true
        );
        break;
      case MenuAction.HoverPhrase:
        clearAllThenUpdateAndCounterupdatePhrases(
          ['isEmphasized', 'isDeemphasized'], // clear
          ['isEmphasized'],                   // update
          ['isDeemphasized'],                 // counterupdate
          [structureOrPhraseId],              // phraseId in the case of MenuAction.HoverPhrase
          true,
          true
        );
        break;
      case MenuAction.Unhover:
        if (!allTranscriptMenusClosed) {
          clearAllThenUpdateAndCounterupdatePhrases(
            ['isEmphasized', 'isDeemphasized'], // clear
            ['isEmphasized'],                   // update
            ['isDeemphasized'],                 // counterupdate
            getAllLinkedPhraseIds(contextPhraseIds),
            true,
            true
          );
        }
        break;
    }
  }, [
    clearPhraseEmphasis, beginStructureEdit, clearAllThenUpdateAndCounterupdatePhrases, getAllStructurePhraseIds,
    contextPhraseIds, allTranscriptMenusClosed
  ]);

  const updateMenuVisibility = useCallback((menuId: TranscriptMenuId, isVisible: boolean) => {
    setTranscriptMenuVisibility(vis => ({
      ...vis,
      [menuId]: isVisible
    }));
  }, [setTranscriptMenuVisibility]);

  const makeHighlightedPhrasePending = useCallback((role: PhraseRole) => {
    setPendingPhrase(highlightedPhrase, role);
    setHighlightedPhrase(null);
  }, [highlightedPhrase, setPendingPhrase, setHighlightedPhrase]);

  // reset all phrase view states whenever phraseLinks changes
  useEffect(() => {
    const pvs: { [phraseId: string]: PhraseViewState } = {};
    Object.keys(phraseLinks).forEach((phraseId: string) => {
      pvs[phraseId] = { isSelected: false, isDeemphasized: false, isEmphasized: false, isPending: false };
    });

    setPhraseViewStates(pvs);
  }, [setPhraseViewStates, phraseLinks]);

  useEffect(() => {
    if (allTranscriptMenusClosed) {
      clearPhraseEmphasis();
      // clear hover on header key whenever a menu is closed so it doesn't remain 
      // hover-styled in the menu after being clicked
      setMultiLinkHeaderHoveredKey(null);

      // TODO remove after done debugging
      // uncomment to keep menu open
      // if (lme) {
      //   showContextMenu({ event: lme, id: TranscriptMenuId.StructureSelectMenu });
      // }
    }
  }, [allTranscriptMenusClosed, clearPhraseEmphasis, setMultiLinkHeaderHoveredKey, lme]);

  const value = useMemo(() => ({
    phraseViewStates, handlePhraseAction, handleStructureSelectMenuAction, updateMenuVisibility, clearPhraseEmphasis, clearPhraseSelection,
    contextPhraseIds, highlightedPhrase, setHighlightedPhrase, makeHighlightedPhrasePending,
    multiLinkHeaderHoveredKey, setMultiLinkHeaderHoveredKey
  }), [
    phraseViewStates, handlePhraseAction, handleStructureSelectMenuAction, updateMenuVisibility, clearPhraseEmphasis, clearPhraseSelection,
    contextPhraseIds, highlightedPhrase, setHighlightedPhrase, makeHighlightedPhrasePending,
    multiLinkHeaderHoveredKey, setMultiLinkHeaderHoveredKey
  ]);

  return (
    <TranscriptInteractionContext.Provider value={value}>
      { children }
    </TranscriptInteractionContext.Provider>
  );
};
