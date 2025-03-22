import { createContext, useCallback, useContext, useMemo, useState } from 'react';

import { Phrase, PhraseRepetition, TranscriptLine, TABS } from './data';
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
  pendingPhraseRepetition: PhraseRepetition | null;
  setNewTranscript: (lines: TranscriptLine[]) => void;
  setPendingPhrase: (phrase: Phrase) => void;
  setPendingRepeatedPhrase: (phrase: Phrase) => void;
  clearPendingPhraseRepetition: () => void;
  addPendingPhraseToRepetitions: () => void;
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
  pendingPhraseRepetition: null,
  setNewTranscript: () => {},
  setPendingPhrase: () => {},
  setPendingRepeatedPhrase: () => {},
  clearPendingPhraseRepetition: () => {},
  addPendingPhraseToRepetitions: () => {}
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
  const [pendingPhraseRepetition, setPendingPhraseRepetition] = useState<PhraseRepetition | null>(null);

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

  const setPendingPhrase = useCallback((phrase: Phrase) => {
    setPendingPhraseRepetition({ phrase, repetionOf: {} as Phrase });
  }, [setPendingPhraseRepetition]);
  
  const setPendingRepeatedPhrase = useCallback((repeatedPhrase: Phrase) => {
    setPendingPhraseRepetition(rep => ({
      phrase: (rep as PhraseRepetition).phrase,
      repetionOf: repeatedPhrase
    }));
  }, [setPendingPhraseRepetition]);
  
  const clearPendingPhraseRepetition = useCallback(() => {
    setPendingPhraseRepetition(null);
  }, [setPendingPhraseRepetition]);

  const addPendingPhraseToRepetitions = useCallback(() => {
    setPhraseRepetitions(prs => {
      if (pendingPhraseRepetition) {
        const newPrs = ([] as PhraseRepetition[]).concat(prs).concat(pendingPhraseRepetition);
        // TODO sort
        return newPrs;
      } else {
        return prs;
      }
    });
    setPendingPhraseRepetition(null);
  }, [pendingPhraseRepetition, setPhraseRepetitions]);

  const value = useMemo(() => ({
    activeTabId, setActiveTabId,
    displayedModalId, isModalShowing, showConfirmationModal, hideModals, modalMessage, modalOnConfirm,
    transcriptLines, phraseRepetitions, pendingPhraseRepetition,
    setNewTranscript, setPendingPhrase, setPendingRepeatedPhrase, clearPendingPhraseRepetition,
    addPendingPhraseToRepetitions
  }), [
    activeTabId, setActiveTabId,
    displayedModalId, isModalShowing, showConfirmationModal, hideModals, modalMessage, modalOnConfirm,
    transcriptLines, phraseRepetitions, pendingPhraseRepetition,
    setNewTranscript, setPendingPhrase, setPendingRepeatedPhrase, clearPendingPhraseRepetition,
    addPendingPhraseToRepetitions
  ]);

  return (
    <ViewStateContext.Provider value={value}>
      { children }
    </ViewStateContext.Provider>
  );
};

export { ViewStateProvider, useViewState };
