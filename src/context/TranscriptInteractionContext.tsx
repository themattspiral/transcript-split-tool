import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useContextMenu } from 'react-contexify';

import { Phrase, PhraseAction, PhraseRole, PhraseViewState } from '../data/data';
import { useUserData } from './UserDataContext';
import { useStructureEdit } from './StructureEditContext';
import { PHRASE_EDIT_MENU_ID } from '../context-menu/PhraseEditMenu';

interface TranscriptInteractionContextProps {
  phraseViewStates: { [phraseId: string]: PhraseViewState };
  handlePhraseAction: (event: React.MouseEvent, phraseIds: string[], action: PhraseAction) => void;
  clearHover: () => void;
  clearClick: () => void;

  // right-clicked existing phrase ids
  contextPhraseIds: string[];

  // highlighted potentially-new Phrase
  highlightedPhrase: Phrase | null;
  setHighlightedPhrase: (phrase: Phrase | null) => void;
  makeHighlightedPhrasePending: (role: PhraseRole) => void;
}

const TranscriptInteractionContext = createContext<TranscriptInteractionContextProps>({
  phraseViewStates: {},
  handlePhraseAction: () => {},
  clearHover: () => {},
  clearClick: () => {},
  contextPhraseIds: [],
  highlightedPhrase: null,
  setHighlightedPhrase: () => {},
  makeHighlightedPhrasePending: () => {}
});

const useTranscriptInteraction = () => {
  const context = useContext(TranscriptInteractionContext);
  if (!context) {
    throw new Error(`useTranscriptInteraction must be used within a TranscriptInteractionProvider`);
  }
  return context;
};

const TranscriptInteractionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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
        updated[id][fieldName] = value;
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
        showContextMenu({ event, id: PHRASE_EDIT_MENU_ID });
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

export { TranscriptInteractionProvider, useTranscriptInteraction };
