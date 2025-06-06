import { createContext, useContext } from 'react';

import { Phrase, PhraseLinkInfo, PhraseRole, TypeOfPoeticStructure } from '../shared/data';

export enum EditState {
  Idle = 'Idle',
  CreatingNew = 'CreatingNew',
  EditingExisting = 'EditingExisting'
}

export interface EditInfo {
  repetitionToShow: Phrase | null;
  sourceToShow: Phrase | null;
  topsToShow: TypeOfPoeticStructure | null;
  repetitionModified: boolean;
  sourceModified: boolean;
  topsModified: boolean;
}

interface StructureEditContextProps {
  editState: EditState,
  editInfo: EditInfo,
  setPendingPhrase: (phrase: Phrase | null, role: PhraseRole) => void;
  setPendingTops: (tops: TypeOfPoeticStructure) => void;
  beginStructureEdit: (structureId: string) => void;
  savePendingStructureEdit: () => void;
  deleteStructureUnderEdit: () => void;
  clearAllPending: () => void;
  pendingPhraseLinks: { [phraseId: string]: PhraseLinkInfo };
  pendingLinePhrases: { [lineNumber: string]: Phrase[] };
}

export const StructureEditContext = createContext<StructureEditContextProps>({
  editState: EditState.Idle,
  editInfo: { } as EditInfo,
  setPendingPhrase: () => {},
  setPendingTops: () => {},
  beginStructureEdit: () => {},
  savePendingStructureEdit: () => {},
  deleteStructureUnderEdit: () => {},
  clearAllPending: () => {},
  pendingPhraseLinks: {},
  pendingLinePhrases: {}
});

export const useStructureEdit = () => {
  const context = useContext(StructureEditContext);
  if (!context) {
    throw new Error(`useStructureEdit must be used within a StructureEditProvider`);
  }
  return context;
};
