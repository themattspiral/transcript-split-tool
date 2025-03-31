import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { useEditState } from './EditStateContext';

interface PhraseStateContextProps {
  hoveredPhraseKeys: Set<string>;
  setHoveredPhraseKeys: (key: Set<string>) => void;
  clickedPhraseKeys: Set<string>;
  setClickedPhraseKeys: (key: Set<string>) => void;
}

const PhraseStateContext = createContext<PhraseStateContextProps>({
  hoveredPhraseKeys: new Set(),
  setHoveredPhraseKeys: () => {},
  clickedPhraseKeys: new Set(),
  setClickedPhraseKeys: () => {}
});

const usePhraseState = () => {
  const context = useContext(PhraseStateContext);
  if (!context) {
    throw new Error(`usePhraseState must be used within a PhraseStateProvider`);
  }
  return context;
};

const PhraseStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hoveredPhraseKeys, setHoveredPhraseKeys] = useState<Set<string>>(new Set());
  const [clickedPhraseKeys, setClickedPhraseKeys] = useState<Set<string>>(new Set());

  const { pendingPhrase, pendingRepeatedPhrase } = useEditState();

  // unset any clicked phrases while defining/editing a repetition
  useEffect(() => {
    if (pendingPhrase || pendingRepeatedPhrase) {
      setClickedPhraseKeys(new Set());
    }
  }, [pendingPhrase, pendingRepeatedPhrase]);

  const value = useMemo(() => ({
    hoveredPhraseKeys, clickedPhraseKeys, setHoveredPhraseKeys, setClickedPhraseKeys
  }), [
    hoveredPhraseKeys, clickedPhraseKeys, setHoveredPhraseKeys, setClickedPhraseKeys
  ]);

  return (
    <PhraseStateContext.Provider value={value}>
      { children }
    </PhraseStateContext.Provider>
  );
};

export { PhraseStateProvider, usePhraseState };
