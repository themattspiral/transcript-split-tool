import { createContext, useContext } from 'react';

import { Phrase, PhraseRole, TypeOfPoeticStructure } from '../shared/data';

export enum EditState {
  Idle = 'Idle',
  CreatingNew = 'CreatingNew',
  EditingExisting = 'EditingExisting'
}

interface StructureEditContextProps {
  editState: EditState,
  pendingRepetition: Phrase | null;
  pendingSource: Phrase | null;
  setPendingPhrase: (phrase: Phrase | null, role: PhraseRole) => void;
  pendingTops: TypeOfPoeticStructure | null;
  setPendingTops: (tops: TypeOfPoeticStructure) => void;
  editingStructureId: string | null;
  beginStructureEdit: (structureId: string) => void;
  savePendingStructureEdit: () => void;
  deleteStructureUnderEdit: () => void;
  createNewStructureFromPending: () => void;
  clearAllPending: () => void;
}

export const StructureEditContext = createContext<StructureEditContextProps>({
  editState: EditState.Idle,
  pendingRepetition: null,
  pendingSource: null,
  setPendingPhrase: () => {},
  pendingTops: null,
  setPendingTops: () => {},
  editingStructureId: null,
  beginStructureEdit: () => {},
  savePendingStructureEdit: () => {},
  deleteStructureUnderEdit: () => {},
  createNewStructureFromPending: () => {},
  clearAllPending: () => {}
});

export const useStructureEdit = () => {
  const context = useContext(StructureEditContext);
  if (!context) {
    throw new Error(`useStructureEdit must be used within a StructureEditProvider`);
  }
  return context;
};
