import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { Phrase, PhraseRepetition, TranscriptLine, TabId } from './data/data';
import { sortPhraseRepetitions, getPhraseKey } from './util/util';
import { CONFIRM_MODAL_ID } from './modal/ConfirmModal';

import reps from './data/reps.data.json';

interface ViewStateContextProps {
  // cross-app state
  activeTabId: TabId;
  setActiveTabId: (tab: TabId) => void;
  displayedModalId: string | null;
  isModalShowing: boolean;
  showConfirmationModal: (message: string, onConfirm: () => void) => void;
  hideModals: () => void;
  modalMessage: string | null;
  modalOnConfirm: (() => void) | null;

  // serializable data
  transcriptLines: TranscriptLine[];
  setNewTranscript: (lines: TranscriptLine[]) => void;
  phraseRepetitions: PhraseRepetition[];
  addPendingPhrasesToRepetitions: () => void;

  // ephemeral data
  phraseLinks: { [key: string]: Set<string> };
  pendingPhrase: Phrase | null;
  setPendingPhrase: (phrase: Phrase) => void;
  pendingRepeatedPhrase: Phrase | null;
  setPendingRepeatedPhrase: (phrase: Phrase) => void;
  clearPendingPhrases: () => void;
  hoveredPhraseKeys: Set<string>;
  setHoveredPhraseKeys: (key: Set<string>) => void;
  clickedPhraseKeys: Set<string>;
  setClickedPhraseKeys: (key: Set<string>) => void;

}

const ViewStateContext = createContext<ViewStateContextProps>({
  activeTabId: TabId.Transcript,
  setActiveTabId: () => {},
  displayedModalId: null,
  isModalShowing: false,
  showConfirmationModal: () => {},
  hideModals: () => {},
  modalMessage: null,
  modalOnConfirm: null,
  transcriptLines: [],
  phraseRepetitions: [],
  phraseLinks: {},
  pendingPhrase: null,
  pendingRepeatedPhrase: null,
  hoveredPhraseKeys: new Set(),
  clickedPhraseKeys: new Set(),
  setNewTranscript: () => {},
  setPendingPhrase: () => {},
  setPendingRepeatedPhrase: () => {},
  setHoveredPhraseKeys: () => {},
  setClickedPhraseKeys: () => {},
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
  const [activeTabId, setActiveTabId] = useState<TabId>(TabId.Transcript);
  const [displayedModalId, setDisplayedModalId] = useState<string | null>(null);
  const isModalShowing = !!displayedModalId;
  const [modalMessage, setModalMessage] = useState<string | null>(null);
  const [modalOnConfirm, setModalOnConfirm] = useState<(() => void) | null>(null);
  
  // serializable data
  const [transcriptLines, setTranscriptLines] = useState<TranscriptLine[]>([]);
  const [phraseRepetitions, setPhraseRepetitions] = useState<PhraseRepetition[]>([]);

  // ephemeral data
  const [pendingPhrase, setPendingPhrase] = useState<Phrase | null>(null);
  const [pendingRepeatedPhrase, setPendingRepeatedPhrase] = useState<Phrase | null>(null);
  const [hoveredPhraseKeys, setHoveredPhraseKeys] = useState<Set<string>>(new Set());
  const [clickedPhraseKeys, setClickedPhraseKeys] = useState<Set<string>>(new Set());

  // unset any clicked phrases while defining/editing a repetition
  useEffect(() => {
    if (pendingPhrase || pendingRepeatedPhrase) {
      setClickedPhraseKeys(new Set());
    }
  }, [pendingPhrase, pendingRepeatedPhrase]);

  const phraseLinks = useMemo(() => {
    const links = {} as { [key: string]: Set<string> };

    phraseRepetitions.forEach(rep => {
      const phraseKey = getPhraseKey(rep.phrase);
      const repKey = getPhraseKey(rep.repetionOf);

      if (!links[phraseKey]) {
        links[phraseKey] = new Set([repKey]);
      } else {
        links[phraseKey].add(repKey);
      }

      if (!links[repKey]) {
        links[repKey] = new Set([phraseKey]);
      } else {
        links[repKey].add(phraseKey);
      }
    });

    return links;
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
    
    // TEST DATA
    setPhraseRepetitions(reps);
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
    transcriptLines, phraseRepetitions, phraseLinks,
    pendingPhrase, pendingRepeatedPhrase, hoveredPhraseKeys, clickedPhraseKeys,
    setNewTranscript, setPendingPhrase, setPendingRepeatedPhrase, setHoveredPhraseKeys, setClickedPhraseKeys,
    clearPendingPhrases, addPendingPhrasesToRepetitions
  }), [
    activeTabId, setActiveTabId,
    displayedModalId, isModalShowing, showConfirmationModal, hideModals, modalMessage, modalOnConfirm,
    transcriptLines, phraseRepetitions, phraseLinks,
    pendingPhrase, pendingRepeatedPhrase, hoveredPhraseKeys, clickedPhraseKeys,
    setNewTranscript, setPendingPhrase, setPendingRepeatedPhrase, setHoveredPhraseKeys, setClickedPhraseKeys,
    clearPendingPhrases, addPendingPhrasesToRepetitions
  ]);

  return (
    <ViewStateContext.Provider value={value}>
      { children }
    </ViewStateContext.Provider>
  );
};

export { ViewStateProvider, useViewState };
