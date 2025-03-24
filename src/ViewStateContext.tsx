import { createContext, useCallback, useContext, useMemo, useState } from 'react';

import { Phrase, PhraseRepetition, TranscriptLine, TABS, sortPhraseRepetitions, getPhraseKey } from './data';
import { CONFIRM_MODAL_ID } from './modal/ConfirmModal';

interface ViewStateContextProps {
  // cross-app state
  activeTabId: string;
  setActiveTabId: (tabId: string) => void;
  displayedModalId: string | null;
  isModalShowing: boolean;
  showConfirmationModal: (message: string, onConfirm: () => void) => void;
  hideModals: () => void;
  modalMessage: string | null;
  modalOnConfirm: (() => void) | null;

  // data
  transcriptLines: TranscriptLine[];
  phraseRepetitions: PhraseRepetition[];
  pendingPhrase: Phrase | null;
  pendingRepeatedPhrase: Phrase | null;
  repeatedPhraseRefCounts: { [key: string]: number};
  setNewTranscript: (lines: TranscriptLine[]) => void;
  setPendingPhrase: (phrase: Phrase) => void;
  setPendingRepeatedPhrase: (phrase: Phrase) => void;
  clearPendingPhrases: () => void;
  addPendingPhrasesToRepetitions: () => void;
}

const ViewStateContext = createContext<ViewStateContextProps>({
  activeTabId: '',
  setActiveTabId: () => {},
  displayedModalId: null,
  isModalShowing: false,
  showConfirmationModal: () => {},
  hideModals: () => {},
  modalMessage: null,
  modalOnConfirm: null,
  transcriptLines: [],
  phraseRepetitions: [],
  pendingPhrase: null,
  pendingRepeatedPhrase: null,
  repeatedPhraseRefCounts: {},
  setNewTranscript: () => {},
  setPendingPhrase: () => {},
  setPendingRepeatedPhrase: () => {},
  clearPendingPhrases: () => {},
  addPendingPhrasesToRepetitions: () => {}
});

const useViewState = () => {
  const context = useContext(ViewStateContext);
  if (!context) {
    throw new Error(`useViewState must be used within a ViewStateProvider`);
  }
  return context;
};

const ViewStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // cross-app state
  const [activeTabId, setActiveTabId] = useState<string>(TABS.Transcript);
  const [displayedModalId, setDisplayedModalId] = useState<string | null>(null);
  const isModalShowing = !!displayedModalId;
  const [modalMessage, setModalMessage] = useState<string | null>(null);
  const [modalOnConfirm, setModalOnConfirm] = useState<(() => void) | null>(null);
  
  // data
  const [transcriptLines, setTranscriptLines] = useState<TranscriptLine[]>([]);
  const [phraseRepetitions, setPhraseRepetitions] = useState<PhraseRepetition[]>([]);
  const [pendingPhrase, setPendingPhrase] = useState<Phrase | null>(null);
  const [pendingRepeatedPhrase, setPendingRepeatedPhrase] = useState<Phrase | null>(null);

  const repeatedPhraseRefCounts = useMemo(() => {
    const counts = {} as { [key: string]: number };

    phraseRepetitions.forEach(rep => {
      const key = getPhraseKey(rep.repetionOf);

      if (!counts[key]) {
        counts[key] = 1;
      } else {
        counts[key]++;
      }
    });

    return counts;
  }, [phraseRepetitions]);

  const showConfirmationModal = useCallback((message: string, onConfirm: () => void) => {
    setModalMessage(message);
    setModalOnConfirm(() => onConfirm);
    setDisplayedModalId(CONFIRM_MODAL_ID);
  }, [setDisplayedModalId, setModalMessage, setModalOnConfirm]);

  const hideModals = useCallback(() => {
    setDisplayedModalId(null);
    setModalMessage(null);
    setModalOnConfirm(null);
  }, [setDisplayedModalId, setModalMessage, setModalOnConfirm]);

  const setNewTranscript = useCallback((lines: TranscriptLine[]) => {
    setTranscriptLines(lines);
  }, [setTranscriptLines]);
  
  const clearPendingPhrases = useCallback(() => {
    setPendingPhrase(null);
    setPendingRepeatedPhrase(null);
  }, [setPendingPhrase, setPendingRepeatedPhrase]);

  const addPendingPhrasesToRepetitions = useCallback(() => {
    setPhraseRepetitions(prs => {
      if (pendingPhrase && pendingRepeatedPhrase) {

        const newPrs = ([] as PhraseRepetition[]).concat(prs).concat({
          phrase: { ...pendingPhrase, isPending: false },
          repetionOf: { ...pendingRepeatedPhrase, isPending: false }
        });
        newPrs.sort(sortPhraseRepetitions);
        return newPrs;
      } else {
        return prs;
      }
    });

    setPendingPhrase(null);
    setPendingRepeatedPhrase(null);
  }, [
    pendingPhrase, pendingRepeatedPhrase,
    setPendingPhrase, setPendingRepeatedPhrase, setPhraseRepetitions
  ]);

  const value = useMemo(() => ({
    activeTabId, setActiveTabId,
    displayedModalId, isModalShowing, showConfirmationModal, hideModals, modalMessage, modalOnConfirm,
    transcriptLines, phraseRepetitions, pendingPhrase, pendingRepeatedPhrase, repeatedPhraseRefCounts,
    setNewTranscript, setPendingPhrase, setPendingRepeatedPhrase, clearPendingPhrases,
    addPendingPhrasesToRepetitions
  }), [
    activeTabId, setActiveTabId,
    displayedModalId, isModalShowing, showConfirmationModal, hideModals, modalMessage, modalOnConfirm,
    transcriptLines, phraseRepetitions, pendingPhrase, pendingRepeatedPhrase, repeatedPhraseRefCounts,
    setNewTranscript, setPendingPhrase, setPendingRepeatedPhrase, clearPendingPhrases,
    addPendingPhrasesToRepetitions
  ]);

  return (
    <ViewStateContext.Provider value={value}>
      { children }
    </ViewStateContext.Provider>
  );
};

export { ViewStateProvider, useViewState };
