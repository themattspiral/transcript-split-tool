import { createContext, useContext } from 'react';

import { MenuAction, Phrase, PhraseAction, PhraseRole, PhraseViewState } from '../shared/data';

interface TranscriptInteractionContextProps {
  phraseViewStates: { [phraseId: string]: PhraseViewState };
  handlePhraseAction: (event: React.MouseEvent, phraseIds: string[], action: PhraseAction) => void;
  handleMenuAction: (structureId: string, action: MenuAction) => void;
  clearHover: () => void;
  clearClick: () => void;
  contextPhraseIds: string[];
  highlightedPhrase: Phrase | null;
  setHighlightedPhrase: (phrase: Phrase | null) => void;
  makeHighlightedPhrasePending: (role: PhraseRole) => void;
}

export const TranscriptInteractionContext = createContext<TranscriptInteractionContextProps>({
  phraseViewStates: {},
  handlePhraseAction: () => {},
  handleMenuAction: () => {},
  clearHover: () => {},
  clearClick: () => {},
  contextPhraseIds: [],
  highlightedPhrase: null,
  setHighlightedPhrase: () => {},
  makeHighlightedPhrasePending: () => {}
});

export const useTranscriptInteraction = () => {
  const context = useContext(TranscriptInteractionContext);
  if (!context) {
    throw new Error(`useTranscriptInteraction must be used within a TranscriptInteractionProvider`);
  }
  return context;
};
