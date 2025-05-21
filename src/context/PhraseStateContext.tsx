import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { useUserData } from './UserDataContext';
import { useEditState } from './EditStateContext';
import { PhraseAction, PhraseLink, PhraseRole, PhraseViewState } from '../data/data';

interface PhraseStateContextProps {
  phraseViewStates: { [phraseId: string]: PhraseViewState };
  handlePhraseAction: (phraseIds: string[], action: PhraseAction) => void;
  clearHover: () => void;
  clearClick: () => void;
}

const PhraseStateContext = createContext<PhraseStateContextProps>({
  phraseViewStates: {},
  handlePhraseAction: () => {},
  clearHover: () => {},
  clearClick: () => {}
});

const usePhraseState = () => {
  const context = useContext(PhraseStateContext);
  if (!context) {
    throw new Error(`usePhraseState must be used within a PhraseStateProvider`);
  }
  return context;
};

const PhraseStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [phraseViewStates, setPhraseViewStates] = useState<{ [phraseId: string]: PhraseViewState }>({});
  const { phraseLinks } = useUserData();

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

  const handlePhraseAction = useCallback((phraseIds: string[], action: PhraseAction) => {
    let allLinkedPhraseIds: string[] = Array.from(new Set(
      phraseIds.flatMap((phraseId: string) => phraseLinks[phraseId].linkedPhraseIds)
    ));

    switch (action) {
      case PhraseAction.Hover:
        clearHover();
        updatePhraseSet(allLinkedPhraseIds, 'isHovered', true);
        break;
      case PhraseAction.Click:
        const currentState = phraseViewStates[phraseIds[0]].isClicked;
        clearClick();
        updatePhraseSet(allLinkedPhraseIds, 'isClicked', !currentState);
        break;
      case PhraseAction.Context:
        break;
    }
  }, [phraseLinks, phraseViewStates, setPhraseViewStates]);

  const clearHover = useCallback(() => {
    updateAllPhrases('isHovered', false);
  }, [updateAllPhrases]);

  const clearClick = useCallback(() => {
    updateAllPhrases('isClicked', false);
  }, [setPhraseViewStates]);

  // const { pendingPhrase, pendingRepeatedPhrase } = useEditState();

  // unset any clicked phrases while defining/editing a repetition
  // useEffect(() => {
  //   if (pendingPhrase || pendingRepeatedPhrase) {
  //     setClickedPhraseKeys(new Set());
  //   }
  // }, [pendingPhrase, pendingRepeatedPhrase]);

  const value = useMemo(() => ({
    phraseViewStates, handlePhraseAction, clearHover, clearClick
  }), [
    phraseViewStates, handlePhraseAction, clearHover, clearClick
  ]);

  return (
    <PhraseStateContext.Provider value={value}>
      { children }
    </PhraseStateContext.Provider>
  );
};

export { PhraseStateProvider, usePhraseState };
