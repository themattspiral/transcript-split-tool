import { createContext, useContext } from 'react';

import { MenuAction, Phrase, PhraseAction, PhraseLinkInfo, PhraseRole, PhraseViewState, Transcript } from 'data';
import { TranscriptMenuId } from 'pages/project/transcript-view/menus/transcript-menus';

interface TranscriptInteractionContextProps {
  selectedTranscript: Transcript | null;
  setSelectedTranscriptId: (transcriptId: string) => void;
  phraseLinks: { [phraseId: string]: PhraseLinkInfo };
  linePhrases: { [lineNumber: string]: Phrase[] };
  getAllLinkedPhraseIds: (phraseIds: string[]) => string[];
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
  selectedTranscript: null,
  setSelectedTranscriptId: () => {},
  phraseLinks: {},
  linePhrases: {},
  getAllLinkedPhraseIds: () => [],
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
