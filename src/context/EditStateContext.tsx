import { createContext, useCallback, useContext, useMemo, useState } from 'react';

import { Phrase } from '../data/data';
import { clearDocumentTextSelection } from '../util/util';
import { useUserData } from './UserDataContext';

interface EditStateContextProps {
  contextPhrase: Phrase | null;
  setContextPhrase: (phrase: Phrase | null) => void;
  contextPhraseRepetitionId: string | null;
  setContextPhraseRepetitionId: (id: string | null) => void;
  setContextPhraseAsPendingPhrase: () => void;
  setContextPhraseAsPendingRepeatedPhrase: () => void;
  pendingPhrase: Phrase | null;
  setPendingPhrase: (phrase: Phrase | null) => void;
  pendingRepeatedPhrase: Phrase | null;
  setPendingRepeatedPhrase: (phrase: Phrase | null) => void;
  clearPendingPhrases: () => void;
  editContextPhraseRepetition: () => void;
  pendingPhraseRepetitionEditId: string | null;
  setPendingPhraseRepetitionEditId: (id: string | null) => void;
  addPendingPhrasesToRepetitions: () => void;
  replaceRepetitionWithPendingPhrases: (replaceId: string) => void;
}

const EditStateContext = createContext<EditStateContextProps>({
  contextPhrase: null,
  setContextPhrase: () => {},
  contextPhraseRepetitionId: null,
  setContextPhraseRepetitionId: () => {},
  setContextPhraseAsPendingPhrase: () => {},
  setContextPhraseAsPendingRepeatedPhrase: () => {},
  pendingPhrase: null,
  setPendingPhrase: () => {},
  pendingRepeatedPhrase: null,
  setPendingRepeatedPhrase: () => {},
  clearPendingPhrases: () => {},
  editContextPhraseRepetition: () => {},
  pendingPhraseRepetitionEditId: null,
  setPendingPhraseRepetitionEditId: () => {},
  addPendingPhrasesToRepetitions: () => {},
  replaceRepetitionWithPendingPhrases: () => {}
});

const useEditState = () => {
  const context = useContext(EditStateContext);
  if (!context) {
    throw new Error(`useEditState must be used within a EditStateProvider`);
  }
  return context;
};

const EditStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [contextPhrase, setContextPhrase] = useState<Phrase | null>(null);
  const [contextPhraseRepetitionId, setContextPhraseRepetitionId] = useState<string | null>(null);
  const [pendingPhrase, setPendingPhrase] = useState<Phrase | null>(null);
  const [pendingRepeatedPhrase, setPendingRepeatedPhrase] = useState<Phrase | null>(null);
  const [pendingPhraseRepetitionEditId, setPendingPhraseRepetitionEditId] = useState<string | null>(null);

  const { addPhraseRepetition, removePhraseRepetition, phraseRepetitions } = useUserData();
  
  const clearPendingPhrases = useCallback(() => {
    setPendingPhrase(null);
    setPendingRepeatedPhrase(null);
    setPendingPhraseRepetitionEditId(null);
  }, [setPendingPhrase, setPendingRepeatedPhrase, setPendingPhraseRepetitionEditId]);

  const addPendingPhrasesToRepetitions = useCallback(() => {
    if (pendingPhrase && pendingRepeatedPhrase) {

      addPhraseRepetition({
        phrase: { ...pendingPhrase, isPending: false },
        repeatedPhrase: { ...pendingRepeatedPhrase, isPending: false, isRepeated: true }
      });

      clearPendingPhrases();
    }
  }, [pendingPhrase, pendingRepeatedPhrase, addPhraseRepetition, clearPendingPhrases]);
  
  const replaceRepetitionWithPendingPhrases = useCallback((replaceId: string) => {
    if (pendingPhrase && pendingRepeatedPhrase && pendingPhraseRepetitionEditId) {
      removePhraseRepetition(replaceId);

      addPhraseRepetition({
        phrase: { ...pendingPhrase, isPending: false },
        repeatedPhrase: { ...pendingRepeatedPhrase, isPending: false, isRepeated: true }
      });

      clearPendingPhrases();
    }
  }, [pendingPhrase, pendingRepeatedPhrase, addPhraseRepetition, removePhraseRepetition, clearPendingPhrases]);

  const setContextPhraseAsPendingPhrase = useCallback(() => {
    setPendingPhrase({ ...contextPhrase, isPending: true, isRepeated: false } as Phrase);
    clearDocumentTextSelection();
  }, [contextPhrase, setPendingPhrase]);
  
  const setContextPhraseAsPendingRepeatedPhrase = useCallback(() => {
    setPendingRepeatedPhrase({ ...contextPhrase, isPending: true, isRepeated: true } as Phrase);
    clearDocumentTextSelection();
  }, [contextPhrase, setPendingRepeatedPhrase]);

  const editContextPhraseRepetition = useCallback(() => {
    if (contextPhraseRepetitionId) {
      setPendingPhraseRepetitionEditId(contextPhraseRepetitionId);
      setPendingPhrase(phraseRepetitions[contextPhraseRepetitionId].phrase);
      setPendingRepeatedPhrase(phraseRepetitions[contextPhraseRepetitionId].repeatedPhrase);
    }
  }, [contextPhraseRepetitionId, phraseRepetitions, setPendingPhraseRepetitionEditId, setPendingPhrase, setPendingRepeatedPhrase]);

  const value = useMemo(() => ({
    contextPhrase, contextPhraseRepetitionId, pendingPhrase, pendingRepeatedPhrase, pendingPhraseRepetitionEditId,
    setContextPhrase, setContextPhraseRepetitionId, setPendingPhrase, setPendingRepeatedPhrase, setPendingPhraseRepetitionEditId,
    setContextPhraseAsPendingPhrase, setContextPhraseAsPendingRepeatedPhrase, clearPendingPhrases, editContextPhraseRepetition,
    addPendingPhrasesToRepetitions, replaceRepetitionWithPendingPhrases
  }), [
    contextPhrase, contextPhraseRepetitionId, pendingPhrase, pendingRepeatedPhrase, pendingPhraseRepetitionEditId,
    setContextPhrase, setContextPhraseRepetitionId, setPendingPhrase, setPendingRepeatedPhrase, setPendingPhraseRepetitionEditId,
    setContextPhraseAsPendingPhrase, setContextPhraseAsPendingRepeatedPhrase, clearPendingPhrases, editContextPhraseRepetition,
    addPendingPhrasesToRepetitions, replaceRepetitionWithPendingPhrases
  ]);

  return (
    <EditStateContext.Provider value={value}>
      { children }
    </EditStateContext.Provider>
  );
};

export { EditStateProvider, useEditState };
