import { useCallback, useMemo, useState } from 'react';

import { StructureEditContext, EditState } from './structure-edit-context';
import { PoeticStructure, Phrase, PhraseRole } from '../shared/data';
import { useUserData } from './user-data-context';

export const StructureEditProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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
  
  const clearAllPending = useCallback(() => {
    setPendingRepetition(null);
    setPendingSource(null);
    setEditingStructureId(null);
    setEditState(EditState.Idle);
  }, [setPendingRepetition, setPendingSource, setEditState, setEditingStructureId]);

  const beginStructureEdit = useCallback((structureId: string) => {
    if (editState === EditState.Idle) {
      setEditState(EditState.EditingExisting);
    }

    setEditingStructureId(structureId);

    // todo - use pending for changes only
    const s = poeticStructures[structureId];
    setPendingRepetition(s.repetition);
    // TODO - handle multiple & unary
    setPendingSource(s.sources[0]);

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

  const createNewStructureFromPendingPhrases = useCallback(() => {
    if (editState === EditState.CreatingNew && pendingRepetition && pendingSource) {
      addPoeticStructure(new PoeticStructure(pendingRepetition, [pendingSource]));
      clearAllPending();
    }
  }, [editState, pendingRepetition, pendingSource, addPoeticStructure, clearAllPending]);

  const value = useMemo(() => ({
    editState, pendingRepetition, pendingSource, editingStructureId,
    setPendingPhrase, clearAllPending, beginStructureEdit, savePendingStructureEdit, deleteStructureUnderEdit,
    createNewStructureFromPendingPhrases
  }), [
    editState, pendingRepetition, pendingSource, editingStructureId,
    setPendingPhrase, clearAllPending, beginStructureEdit, savePendingStructureEdit, deleteStructureUnderEdit,
    createNewStructureFromPendingPhrases
  ]);

  return (
    <StructureEditContext.Provider value={value}>
      { children }
    </StructureEditContext.Provider>
  );
};
