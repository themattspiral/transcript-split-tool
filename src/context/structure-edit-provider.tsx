import { useCallback, useMemo, useState } from 'react';

import { StructureEditContext, EditState, EditInfo } from './structure-edit-context';
import { PoeticStructure, Phrase, PhraseRole, TypeOfPoeticStructure, GenericTOPS } from '../shared/data';
import { useUserData } from './user-data-context';

export const StructureEditProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [editState, setEditState] = useState<EditState>(EditState.Idle);
  const [pendingRepetition, setPendingRepetition] = useState<Phrase | null>(null);
  const [pendingSource, setPendingSource] = useState<Phrase | null>(null);
  const [pendingTops, setPendingTops] = useState<TypeOfPoeticStructure | null>(null);
  const [editingStructureId, setEditingStructureId] = useState<string | null>(null);

  const { poeticStructures, topsMap, addPoeticStructure, removePoeticStructure } = useUserData();

  const editInfo: EditInfo = useMemo(() => {
    let repetitionToShow: Phrase | null = null;
    let sourceToShow: Phrase | null = null;
    let topsToShow: TypeOfPoeticStructure | null = null;
    let repetitionModified = false;
    let sourceModified = false;
    let topsModified = false;
    
    if (editState === EditState.CreatingNew) {
      repetitionToShow = pendingRepetition;
      sourceToShow = pendingSource;
      topsToShow = pendingTops;
    } else if (editState === EditState.EditingExisting && editingStructureId) {
      const structure = poeticStructures[editingStructureId]
  
      if (pendingRepetition) {
        repetitionToShow = pendingRepetition;
        repetitionModified = true;
      } else {
        repetitionToShow = structure.repetition;
      }
  
      if (pendingSource) {
        sourceToShow = pendingSource;
        sourceModified = true;
      } else {
        sourceToShow = structure.sources[0];
      }
  
      if (pendingTops) {
        topsToShow = pendingTops;
        topsModified = true;
      } else {
        topsToShow = topsMap[structure.topsId];
      }
    }

    return {
      repetitionToShow,
      sourceToShow,
      topsToShow,
      repetitionModified,
      sourceModified,
      topsModified
    };
  }, [editState, pendingRepetition, pendingSource, pendingTops, editingStructureId, poeticStructures]);

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
  }, [editState, setEditState, setPendingRepetition, setPendingSource, setPendingTops]);
  
  const clearAllPending = useCallback(() => {
    setPendingRepetition(null);
    setPendingSource(null);
    setPendingTops(null);
    setEditingStructureId(null);
    setEditState(EditState.Idle);
  }, [setPendingRepetition, setPendingSource, setPendingTops, setEditState, setEditingStructureId]);

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
    if (
      editState === EditState.CreatingNew
      && editInfo.repetitionToShow && editInfo.sourceToShow && editInfo.topsToShow
    ) {
      addPoeticStructure(new PoeticStructure(
        editInfo.repetitionToShow,
        [editInfo.sourceToShow],
        editInfo.topsToShow.relationshipType,
        editInfo.topsToShow.id
      ));
      clearAllPending();
    } else if (
      editState === EditState.EditingExisting && editingStructureId
      && editInfo.repetitionToShow && editInfo.sourceToShow && editInfo.topsToShow
      && (editInfo.repetitionModified || editInfo.sourceModified || editInfo.topsModified)
    ) {
      removePoeticStructure(editingStructureId);
      addPoeticStructure(new PoeticStructure(
        editInfo.repetitionToShow,
        [editInfo.sourceToShow],
        editInfo.topsToShow.relationshipType,
        editInfo.topsToShow.id
      ));
      clearAllPending();
    }
  }, [editState, editingStructureId, editInfo, addPoeticStructure, removePoeticStructure, clearAllPending]);

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

  const value = useMemo(() => ({
    editState, editInfo, setPendingPhrase, setPendingTops, clearAllPending, 
    beginStructureEdit, savePendingStructureEdit, deleteStructureUnderEdit
  }), [
    editState, editInfo, setPendingPhrase, setPendingTops, clearAllPending,
    beginStructureEdit, savePendingStructureEdit, deleteStructureUnderEdit
  ]);

  return (
    <StructureEditContext.Provider value={value}>
      { children }
    </StructureEditContext.Provider>
  );
};
