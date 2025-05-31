import { useCallback, useEffect, useMemo, useState } from 'react';
import { useContextMenu } from 'react-contexify';

import { TranscriptInteractionContext } from './transcript-interaction-context';
import { MenuAction, Phrase, PhraseAction, PhraseRole, PhraseViewState } from '../shared/data';
import { useUserData } from './user-data-context';
import { useStructureEdit } from './structure-edit-context';
import { PHRASE_MENU_ID } from '../transcript-view/menus/context-menu';

export const TranscriptInteractionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // a controllable view state for every phrase (all phrases defined in phraseLinks)
  const [phraseViewStates, setPhraseViewStates] = useState<{ [phraseId: string]: PhraseViewState }>({});
  // phrase ids associated with right-clicked span (all phrases associated via current poetic structures)
  const [contextPhraseIds, setContextPhraseIds] = useState<string[]>([]);
  // highlighted phrase when it is right-clicked
  const [highlightedPhrase, setHighlightedPhrase] = useState<Phrase | null>(null);
  
  const { phraseLinks, getAllLinkedPhraseIds, getAllStructurePhraseIds } = useUserData();
  const { setPendingPhrase, beginStructureEdit: beginEdit } = useStructureEdit();
  const { show: showContextMenu } = useContextMenu();

  // reset all phrase view states whenever phraseLinks changes
  useEffect(() => {
    const pvs: { [phraseId: string]: PhraseViewState } = {};
    Object.keys(phraseLinks).forEach((phraseId: string) => {
      pvs[phraseId] = { isClicked: false, isDeemphasized: false, isHovered: false, isPending: false };
    });

    setPhraseViewStates(pvs);
  }, [setPhraseViewStates, phraseLinks]);

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

  const handlePhraseAction = useCallback((event: React.MouseEvent, phraseIds: string[], action: PhraseAction) => {
    const allLinkedPhraseIds: string[] = getAllLinkedPhraseIds(phraseIds);
    
    switch (action) {
      case PhraseAction.Hover:
        clearAllThenUpdatePhrases(allLinkedPhraseIds, 'isHovered', true);
        break;
      case PhraseAction.Unhover:
        clearHover();
        break;
      case PhraseAction.Click:
        // toggle click state
        const currentState = phraseViewStates[phraseIds[0]].isClicked;
        clearAllThenUpdatePhrases(allLinkedPhraseIds, 'isClicked', !currentState);
        break;
      case PhraseAction.Context:
        setContextPhraseIds(phraseIds);
        showContextMenu({ event, id: PHRASE_MENU_ID });
        break;
    }
  }, [getAllLinkedPhraseIds, phraseViewStates, setPhraseViewStates, setContextPhraseIds]);

  const handleMenuAction = useCallback((structureId: string, action: MenuAction) => {
    const allStructureIds = getAllStructurePhraseIds(structureId);
    
    switch (action) {
      case MenuAction.Click:
        clearHover();
        beginEdit(structureId);
        break;
      case MenuAction.Hover:
        clearAllThenUpdatePhrases(allStructureIds, 'isHovered', true);
        break;
      case MenuAction.Unhover:
        clearHover();
        break;
    }
  }, [beginEdit]);

  const clearHover = useCallback(() => {
    updateAllPhrases('isHovered', false);
  }, [updateAllPhrases]);

  const clearClick = useCallback(() => {
    updateAllPhrases('isClicked', false);
  }, [setPhraseViewStates]);

  const makeHighlightedPhrasePending = useCallback((role: PhraseRole) => {
    setPendingPhrase(highlightedPhrase, role);
    setHighlightedPhrase(null);
  }, [highlightedPhrase, setPendingPhrase, setHighlightedPhrase]);

  const value = useMemo(() => ({
    phraseViewStates, handlePhraseAction, handleMenuAction, clearHover, clearClick,
    contextPhraseIds, highlightedPhrase, setHighlightedPhrase, makeHighlightedPhrasePending
  }), [
    phraseViewStates, handlePhraseAction, handleMenuAction, clearHover, clearClick,
    contextPhraseIds, highlightedPhrase, setHighlightedPhrase, makeHighlightedPhrasePending
  ]);

  return (
    <TranscriptInteractionContext.Provider value={value}>
      { children }
    </TranscriptInteractionContext.Provider>
  );
};
