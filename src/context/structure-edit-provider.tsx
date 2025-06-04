import { useCallback, useMemo, useState } from 'react';

import { StructureEditContext, EditState } from './structure-edit-context';
import { PoeticStructure, Phrase, PhraseRole, TypeOfPoeticStructure, GenericTOPS } from '../shared/data';
import { useUserData } from './user-data-context';

export const StructureEditProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [editState, setEditState] = useState<EditState>(EditState.Idle);
  const [pendingRepetition, setPendingRepetition] = useState<Phrase | null>(null);
  const [pendingSource, setPendingSource] = useState<Phrase | null>(null);
  const [pendingTops, setPendingTops] = useState<TypeOfPoeticStructure | null>(null);
  const [editingStructureId, setEditingStructureId] = useState<string | null>(null);

  const { poeticStructures, addPoeticStructure, removePoeticStructure } = useUserData();

  const setPendingPhrase = useCallback((phrase: Phrase | null, role: PhraseRole) => {
    if (editState === EditState.Idle) {
      setEditState(EditState.CreatingNew);
      setPendingTops(GenericTOPS);
    }

    if (role === PhraseRole.Repetition) {
      setPendingRepetition(phrase);
    } else {
      setPendingSource(phrase);
    }
  }, [
    editState, pendingRepetition, pendingSource, pendingTops,
    setEditState, setPendingRepetition, setPendingSource, setPendingTops
  ]);
  
  const clearAllPending = useCallback(() => {
    setPendingRepetition(null);
    setPendingSource(null);
    setEditingStructureId(null);
    setEditState(EditState.Idle);
  }, [setPendingRepetition, setPendingSource, setEditState, setEditingStructureId]);

  const beginStructureEdit = useCallback((structureId: string) => {
    if (editState === EditState.Idle) {
      setEditState(EditState.EditingExisting);
      setEditingStructureId(structureId);
    } else if (editState === EditState.CreatingNew) {
      setEditState(EditState.EditingExisting);
      setEditingStructureId(structureId);
    } else {
      setEditingStructureId(structureId);
    }
  }, [editState, poeticStructures, setEditingStructureId, setPendingRepetition, setPendingSource]);
  
  const savePendingStructureEdit = useCallback(() => {
    if (editState === EditState.EditingExisting && editingStructureId && pendingRepetition && pendingSource) {
      removePoeticStructure(editingStructureId);
      addPoeticStructure(new PoeticStructure(pendingRepetition, [pendingSource]));
      clearAllPending();
    }
  }, [editState, editingStructureId, pendingRepetition, pendingSource, addPoeticStructure, removePoeticStructure, clearAllPending]);

  const deleteStructureUnderEdit = useCallback(() => {
    setEditingStructureId(id => {
      if (id) {
        removePoeticStructure(id);
      }

      return null;
    });
    clearAllPending();
    setEditState(EditState.Idle);
  }, [removePoeticStructure, setEditingStructureId, clearAllPending, setEditState]);

  const createNewStructureFromPending = useCallback(() => {
    if (editState === EditState.CreatingNew && pendingRepetition && pendingSource) {
      addPoeticStructure(new PoeticStructure(pendingRepetition, [pendingSource]));
      clearAllPending();
    }
  }, [editState, pendingRepetition, pendingSource, addPoeticStructure, clearAllPending]);

  const value = useMemo(() => ({
    editState, pendingRepetition, pendingSource, pendingTops, editingStructureId,
    setPendingPhrase, clearAllPending, beginStructureEdit, savePendingStructureEdit, deleteStructureUnderEdit,
    createNewStructureFromPending, setPendingTops
  }), [
    editState, pendingRepetition, pendingSource, pendingTops, editingStructureId,
    setPendingPhrase, clearAllPending, beginStructureEdit, savePendingStructureEdit, deleteStructureUnderEdit,
    createNewStructureFromPending, setPendingTops
  ]);

  return (
    <StructureEditContext.Provider value={value}>
      { children }
    </StructureEditContext.Provider>
  );
};
