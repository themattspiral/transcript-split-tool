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

  const clearHover = useCallback(() => {
    updateAllPhrases('isEmphasized', false);
  }, [updateAllPhrases]);

  const clearClick = useCallback(() => {
    updateAllPhrases('isSelected', false);
  }, [setPhraseViewStates]);

  const handlePhraseAction = useCallback((event: React.MouseEvent, phraseIds: string[], action: PhraseAction) => {
    switch (action) {
      case PhraseAction.Hover:
        // only update hover if no menus are currently showing
        if (allTranscriptMenusClosed) {
          clearAllThenUpdatePhrases(getAllLinkedPhraseIds(phraseIds), 'isEmphasized', true);
        }
        break;
      case PhraseAction.Unhover:
        // only clear hover if no menus are currently showing
        if (allTranscriptMenusClosed) {
          clearHover();
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

        if (!allTranscriptMenusClosed) {
          clearAllThenUpdatePhrases(getAllLinkedPhraseIds(phraseIds), 'isEmphasized', true);
        }

        showContextMenu({ event, id: TranscriptMenuId.StructureSelectMenu });
        setLme(event);
        break;
    }
  }, [
    phraseViewStates, allTranscriptMenusClosed, clearAllThenUpdatePhrases, clearHover,
    getAllLinkedPhraseIds, setPhraseViewStates, setContextPhraseIds, showContextMenu
  ]);

  const handleStructureSelectMenuAction = useCallback((structureOrPhraseId: string, action: MenuAction) => {
    switch (action) {
      case MenuAction.Click:
        clearHover();
        beginStructureEdit(structureOrPhraseId);
        break;
      case MenuAction.HoverStructure:
        clearAllThenUpdatePhrases(getAllStructurePhraseIds(structureOrPhraseId), 'isEmphasized', true);
        break;
      case MenuAction.HoverPhrase:
        clearAllThenUpdatePhrases([structureOrPhraseId], 'isEmphasized', true);
        break;
      case MenuAction.Unhover:
        if (!allTranscriptMenusClosed) {
          clearAllThenUpdatePhrases(getAllLinkedPhraseIds(contextPhraseIds), 'isEmphasized', true);
        }
        break;
    }
  }, [clearHover, beginStructureEdit, clearAllThenUpdatePhrases, contextPhraseIds, allTranscriptMenusClosed]);

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

  // clear hover any header key states whenever a menu is closed
  useEffect(() => {
    if (allTranscriptMenusClosed) {
      clearHover();
      setMultiLinkHeaderHoveredKey(null);

      // TODO remove after done debugging
      // uncomment to keep menu open
      // if (lme) {
      //   showContextMenu({ event: lme, id: TranscriptMenuId.StructureSelectMenu });
      // }
    }
  }, [allTranscriptMenusClosed, clearHover, setMultiLinkHeaderHoveredKey, lme]);

  const value = useMemo(() => ({
    phraseViewStates, handlePhraseAction, handleStructureSelectMenuAction, updateMenuVisibility, clearHover, clearClick,
    contextPhraseIds, highlightedPhrase, setHighlightedPhrase, makeHighlightedPhrasePending,
    multiLinkHeaderHoveredKey, setMultiLinkHeaderHoveredKey
  }), [
    phraseViewStates, handlePhraseAction, handleStructureSelectMenuAction, updateMenuVisibility, clearHover, clearClick,
    contextPhraseIds, highlightedPhrase, setHighlightedPhrase, makeHighlightedPhrasePending,
    multiLinkHeaderHoveredKey, setMultiLinkHeaderHoveredKey
  ]);

  return (
    <TranscriptInteractionContext.Provider value={value}>
      { children }
    </TranscriptInteractionContext.Provider>
  );
};
