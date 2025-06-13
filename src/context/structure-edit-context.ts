import { createContext, useContext } from 'react';

import { Phrase, PhraseRole, TypeOfPoeticStructure, ValidationResult } from '../shared/data';

export enum EditState {
  Idle = 'Idle',
  CreatingNew = 'CreatingNew',
  EditingExisting = 'EditingExisting'
}

export interface EditInfo {
  repetitionToShow: Phrase | null;
  sourcesToShow: Phrase[] | null;
  topsToShow: TypeOfPoeticStructure | null;
  repetitionModified: boolean;
  sourcesModified: boolean;
  topsModified: boolean;
  anyModified: boolean;
}

interface StructureEditContextProps {
  editState: EditState,
  editInfo: EditInfo,
  editValidity: ValidationResult;
  pendingLinePhrases: { [lineNumber: string]: Phrase[] };
  setPendingPhrase: (phrase: Phrase | null, role: PhraseRole) => void;
  setPendingTops: (tops: TypeOfPoeticStructure) => void;
  beginStructureEdit: (structureId: string) => void;
  savePendingStructureEdit: () => void;
  deleteStructureUnderEdit: () => void;
  removeSourceFromStructureUnderEdit: (phraseId: string) => void;
  clearAllPending: () => void;
}

export const StructureEditContext = createContext<StructureEditContextProps>({
  editState: EditState.Idle,
  editInfo: { } as EditInfo,
  editValidity: { isCompleteStructure: false, hasOrderingError: false },
  pendingLinePhrases: {},
  setPendingPhrase: () => {},
  setPendingTops: () => {},
  beginStructureEdit: () => {},
  savePendingStructureEdit: () => {},
  deleteStructureUnderEdit: () => {},
  removeSourceFromStructureUnderEdit: () => {},
  clearAllPending: () => {}
});

export const useStructureEdit = () => {
  const context = useContext(StructureEditContext);
  if (!context) {
    throw new Error(`useStructureEdit must be used within a StructureEditProvider`);
  }
  return context;
};
