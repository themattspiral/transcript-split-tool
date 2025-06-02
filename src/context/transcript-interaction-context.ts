import { createContext, useContext } from 'react';

import { MenuAction, Phrase, PhraseAction, PhraseRole, PhraseViewState } from '../shared/data';
import { TranscriptMenuId } from '../transcript-view/menus/transcript-menus';

interface TranscriptInteractionContextProps {
  phraseViewStates: { [phraseId: string]: PhraseViewState };
  handlePhraseAction: (event: React.MouseEvent, phraseIds: string[], action: PhraseAction) => void;
  handlePhraseMenuAction: (structureOrPhraseId: string, action: MenuAction) => void;
  updateMenuVisibility: (menuId: TranscriptMenuId, isVisible: boolean) => void;
  clearHover: () => void;
  clearClick: () => void;
  contextPhraseIds: string[];
  highlightedPhrase: Phrase | null;
  setHighlightedPhrase: (phrase: Phrase | null) => void;
  makeHighlightedPhrasePending: (role: PhraseRole) => void;
  multiLinkHeaderHoveredKey: string | null;
  setMultiLinkHeaderHoveredKey: (key: string | null) => void;
}

export const TranscriptInteractionContext = createContext<TranscriptInteractionContextProps>({
  phraseViewStates: {},
  handlePhraseAction: () => {},
  handlePhraseMenuAction: () => {},
  updateMenuVisibility: () => {},
  clearHover: () => {},
  clearClick: () => {},
  contextPhraseIds: [],
  highlightedPhrase: null,
  setHighlightedPhrase: () => {},
  makeHighlightedPhrasePending: () => {},
  multiLinkHeaderHoveredKey: null,
  setMultiLinkHeaderHoveredKey: () => {}
});

export const useTranscriptInteraction = () => {
  const context = useContext(TranscriptInteractionContext);
  if (!context) {
    throw new Error(`useTranscriptInteraction must be used within a TranscriptInteractionProvider`);
  }
  return context;
};
