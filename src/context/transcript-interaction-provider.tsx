import { useCallback, useEffect, useMemo, useState } from 'react';
import { useContextMenu } from 'react-contexify';

import { TranscriptInteractionContext } from './transcript-interaction-context';
import { Phrase, PhraseAction, PhraseRole, PhraseViewState } from '../shared/data';
import { useUserData } from './user-data-context';
import { useStructureEdit } from './structure-edit-context';
import { PHRASE_MENU_ID } from '../transcript-view/menus/context-menu';

export const TranscriptInteractionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [phraseViewStates, setPhraseViewStates] = useState<{ [phraseId: string]: PhraseViewState }>({});
  const [contextPhraseIds, setContextPhraseIds] = useState<string[]>([]);
  const [highlightedPhrase, setHighlightedPhrase] = useState<Phrase | null>(null);
  
  const { phraseLinks, getAllLinkedPhraseIds } = useUserData();
  const { setPendingPhrase } = useStructureEdit();
  const { show: showContextMenu } = useContextMenu();

  // reset all phrase view states whenever phraseLinkes change
  useEffect(() => {
    const pvs: { [phraseId: string]: PhraseViewState } = {};
    Object.keys(phraseLinks).forEach((phraseId: string) => {
      pvs[phraseId] = { isClicked: false, isDeemphasized: false, isHovered: false, isPending: false };
    });

    setPhraseViewStates(pvs);
  }, [setPhraseViewStates, phraseLinks]);

  const updateAllPhrases = useCallback((fieldName: keyof PhraseViewState, value: boolean) => {
    setPhraseViewStates(pvs => {
      const updated = { ...pvs };
      Object.values(updated).forEach(pv => {
        pv[fieldName] = value;
      });
      return updated;
    });
  }, [setPhraseViewStates]);

  const updatePhraseSet = useCallback((phraseIds: string[], fieldName: keyof PhraseViewState, value: boolean) => {
    setPhraseViewStates(pvs => {
      const updated = { ...pvs };
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
        clearHover();
        updatePhraseSet(allLinkedPhraseIds, 'isHovered', true);
        break;
      case PhraseAction.Click:
        // toggle click state
        const currentState = phraseViewStates[phraseIds[0]].isClicked;
        clearClick();
        updatePhraseSet(allLinkedPhraseIds, 'isClicked', !currentState);
        break;
      case PhraseAction.Context:
        setContextPhraseIds(phraseIds);
        showContextMenu({ event, id: PHRASE_MENU_ID });
        break;
    }
  }, [getAllLinkedPhraseIds, phraseViewStates, setPhraseViewStates, setContextPhraseIds]);

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

  // const { pendingPhrase, pendingRepeatedPhrase } = useEditState();

  // unset any clicked phrases while defining/editing a repetition
  // useEffect(() => {
  //   if (pendingPhrase || pendingRepeatedPhrase) {
  //     setClickedPhraseKeys(new Set());
  //   }
  // }, [pendingPhrase, pendingRepeatedPhrase]);

  const value = useMemo(() => ({
    phraseViewStates, handlePhraseAction, clearHover, clearClick,
    contextPhraseIds, highlightedPhrase, setHighlightedPhrase, makeHighlightedPhrasePending
  }), [
    phraseViewStates, handlePhraseAction, clearHover, clearClick,
    contextPhraseIds, highlightedPhrase, setHighlightedPhrase, makeHighlightedPhrasePending
  ]);

  return (
    <TranscriptInteractionContext.Provider value={value}>
      { children }
    </TranscriptInteractionContext.Provider>
  );
};
