import { createContext, useContext } from 'react';

import { MenuAction, Phrase, PhraseAction, PhraseRole, PhraseViewState } from 'data';
import { TranscriptMenuId } from '../transcript-view/menus/transcript-menus';

interface TranscriptInteractionContextProps {
  phraseViewStates: { [phraseId: string]: PhraseViewState };
  handlePhraseAction: (event: React.MouseEvent, phraseIds: string[], action: PhraseAction) => void;
  handleStructureSelectMenuAction: (structureOrPhraseId: string, action: MenuAction) => void;
  updateMenuVisibility: (menuId: TranscriptMenuId, isVisible: boolean) => void;
  contextPhraseIds: string[];
  highlightedPhrase: Phrase | null;
  setHighlightedPhrase: (phrase: Phrase | null) => void;
  makeHighlightedPhrasePending: (role: PhraseRole) => void;
}

export const TranscriptInteractionContext = createContext<TranscriptInteractionContextProps>({
  phraseViewStates: {},
  handlePhraseAction: () => {},
  handleStructureSelectMenuAction: () => {},
  updateMenuVisibility: () => {},
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
