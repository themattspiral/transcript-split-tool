import { createContext, useContext } from 'react';

import { Phrase, PhraseRole } from '../shared/data';

export enum EditState {
  Idle,
  CreatingNew,
  EditingExisting
}

interface StructureEditContextProps {
  editState: EditState,
  pendingRepetition: Phrase | null;
  pendingSource: Phrase | null;
  setPendingPhrase: (phrase: Phrase | null, role: PhraseRole) => void;
  beginStructureEdit: (structureId: string) => void;
  savePendingStructureEdit: () => void;
  deleteStructureUnderEdit: () => void;
  createNewStructureFromPendingPhrases: () => void;
  clearAllPending: () => void;
}

export const StructureEditContext = createContext<StructureEditContextProps>({
  editState: EditState.Idle,
  pendingRepetition: null,
  pendingSource: null,
  setPendingPhrase: () => {},
  beginStructureEdit: () => {},
  savePendingStructureEdit: () => {},
  deleteStructureUnderEdit: () => {},
  createNewStructureFromPendingPhrases: () => {},
  clearAllPending: () => {}
});

export const useStructureEdit = () => {
  const context = useContext(StructureEditContext);
  if (!context) {
    throw new Error(`useStructureEdit must be used within a StructureEditProvider`);
  }
  return context;
};
