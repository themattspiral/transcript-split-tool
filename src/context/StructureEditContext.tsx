import { createContext, useCallback, useContext, useMemo, useState } from 'react';

import { PairedStructure, Phrase, PhraseRole } from '../data/data';
import { useUserData } from './UserDataContext';

enum EditState {
  Idle,
  CreatingNew,
  EditingExisting
}

interface StructureEditContextProps {
  editState: EditState,
  pendingRepetition: Phrase | null;
  pendingSource: Phrase | null;
  setPendingPhrase: (phrase: Phrase | null, role: PhraseRole) => void;
  beginEdit: (structureId: string) => void;
  savePendingEdit: () => void;
  createNewStructureFromPendingPhrases: () => void;
  clearPending: () => void;
}

const StructureEditContext = createContext<StructureEditContextProps>({
  editState: EditState.Idle,
  pendingRepetition: null,
  pendingSource: null,
  setPendingPhrase: () => {},
  beginEdit: () => {},
  savePendingEdit: () => {},
  createNewStructureFromPendingPhrases: () => {},
  clearPending: () => {}
});

const useStructureEdit = () => {
  const context = useContext(StructureEditContext);
  if (!context) {
    throw new Error(`useStructureEdit must be used within a StructureEditProvider`);
  }
  return context;
};

const StructureEditProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [editState, setEditState] = useState<EditState>(EditState.Idle);
  const [pendingRepetition, setPendingRepetition] = useState<Phrase | null>(null);
  const [pendingSource, setPendingSource] = useState<Phrase | null>(null);
  const [editingStructureId, setEditingStructureId] = useState<string | null>(null);

  const { poeticStructures, addPoeticStructure, removePoeticStructure } = useUserData();

  const setPendingPhrase = useCallback((phrase: Phrase | null, role: PhraseRole) => {
    if (editState === EditState.Idle) {
      setEditState(EditState.CreatingNew);
    }

    if (role === PhraseRole.Repetition) {
      setPendingRepetition(phrase);
    } else {
      setPendingSource(phrase);
    }

    // auto-add
    // if (
    //   (pendingSource && role === PhraseRole.Repetition)
    //   || (pendingRepetition && role === PhraseRole.Source)
    // ) {
    //   // AUTO ADD
    //   // then switch to edit mode
    // }
  }, [editState, pendingRepetition, pendingSource, setPendingRepetition, setPendingSource]);
  
  const clearPending = useCallback(() => {
    setPendingRepetition(null);
    setPendingSource(null);
    setEditingStructureId(null);
    setEditState(EditState.Idle);
  }, [setPendingRepetition, setPendingSource, setEditState, setEditingStructureId]);

  const beginEdit = useCallback((structureId: string) => {
    if (editState === EditState.Idle) {
      setEditState(EditState.EditingExisting);
    }

    setEditingStructureId(structureId);

    const s = poeticStructures[structureId];
    setPendingRepetition(s.repetition);
    // TODO - handle multiple
    setPendingSource(s.multipleSources ? s.sources[0] : s.source);

  }, [editState, poeticStructures, setEditingStructureId, setPendingRepetition, setPendingSource]);
  
  const savePendingEdit = useCallback(() => {
    if (editState === EditState.EditingExisting && editingStructureId && pendingRepetition && pendingSource) {
      removePoeticStructure(editingStructureId);
      addPoeticStructure(new PairedStructure(pendingRepetition, pendingSource));
      clearPending();
    }
  }, [editState, editingStructureId, pendingRepetition, pendingSource, addPoeticStructure, removePoeticStructure, clearPending]);

  const createNewStructureFromPendingPhrases = useCallback(() => {
    if (editState === EditState.CreatingNew && pendingRepetition && pendingSource) {
      addPoeticStructure(new PairedStructure(pendingRepetition, pendingSource));
      clearPending();
    }
  }, [editState, pendingRepetition, pendingSource, addPoeticStructure, clearPending]);

  const value = useMemo(() => ({
    editState, pendingRepetition, pendingSource, editingStructureId,
    setPendingPhrase, clearPending, beginEdit, savePendingEdit, createNewStructureFromPendingPhrases
  }), [
    editState, pendingRepetition, pendingSource, editingStructureId,
    setPendingPhrase, clearPending, beginEdit, savePendingEdit, createNewStructureFromPendingPhrases
  ]);

  return (
    <StructureEditContext.Provider value={value}>
      { children }
    </StructureEditContext.Provider>
  );
};

export { EditState, StructureEditProvider, useStructureEdit };
