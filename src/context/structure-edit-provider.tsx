import { useCallback, useMemo, useState } from 'react';

import {
  PoeticStructure, Phrase, PhraseRole, TypeOfPoeticStructure,
  GenericTOPS, PoeticStructureRelationshipType, sortPhrases
} from '../shared/data';
import { StructureEditContext, EditState, EditInfo } from './structure-edit-context';
import { useUserData } from './user-data-context';

export const StructureEditProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    poeticStructures, topsMap,
    addPoeticStructure, replacePoeticStructure, removePoeticStructure
  } = useUserData();

  const [editState, setEditState] = useState<EditState>(EditState.Idle);
  const [pendingRepetition, setPendingRepetition] = useState<Phrase | null>(null);
  const [pendingSources, setPendingSources] = useState<Phrase[] | null>(null);
  const [pendingTops, setPendingTops] = useState<TypeOfPoeticStructure | null>(null);
  const [editingStructureId, setEditingStructureId] = useState<string | null>(null);

  const editInfo: EditInfo = useMemo(() => {
    let repetitionToShow: Phrase | null = null;
    let sourcesToShow: Phrase[] | null = null;
    let topsToShow: TypeOfPoeticStructure | null = null;
    let repetitionModified = false;
    let sourcesModified = false;
    let topsModified = false;
    
    if (editState === EditState.CreatingNew) {
      repetitionToShow = pendingRepetition;
      sourcesToShow = pendingSources ? pendingSources.sort(sortPhrases) : pendingSources;
      topsToShow = pendingTops;
    } else if (editState === EditState.EditingExisting && editingStructureId) {
      const structure = poeticStructures[editingStructureId]
  
      if (pendingRepetition !== null) {
        repetitionToShow = pendingRepetition;
        repetitionModified = true;
      } else {
        repetitionToShow = structure.repetition;
      }
  
      if (pendingSources !== null) {
        sourcesToShow = pendingSources;
        sourcesModified = true;
      } else {
        sourcesToShow = structure.sources;
      }
  
      if (pendingTops) {
        topsToShow = pendingTops;
        topsModified = true;
      } else {
        topsToShow = topsMap[structure.topsId].type;
      }
    }

    return {
      repetitionToShow,
      sourcesToShow,
      topsToShow,
      repetitionModified,
      sourcesModified,
      topsModified
    };
  }, [editState, pendingRepetition, pendingSources, pendingTops, editingStructureId, poeticStructures]);

  const pendingLinePhrases = useMemo(() => {
    const lines = {} as { [lineNumber: string]: Phrase[] };

    if (pendingRepetition) {
      lines[pendingRepetition.lineNumber.toString()] = [pendingRepetition];
    }

    if (pendingSources) {
      pendingSources.forEach(s => {
        if (lines[s.lineNumber.toString()]) {
          lines[s.lineNumber.toString()] = lines[s.lineNumber.toString()].concat(s);
        } else {
          lines[s.lineNumber.toString()] = [s];
        }
      });
    }
    return lines;
  }, [pendingRepetition, pendingSources]);

  const setPendingPhrase = useCallback((phrase: Phrase | null, role: PhraseRole) => {
    if (editState === EditState.Idle) {
      setEditState(EditState.CreatingNew);
      setPendingTops(GenericTOPS);
    }

    if (role === PhraseRole.Repetition) {
      setPendingRepetition(phrase);
    } else if (role === PhraseRole.Source) {
      if (!editInfo.topsToShow || editInfo.topsToShow?.relationshipType === PoeticStructureRelationshipType.Paired) {
        setPendingSources(phrase === null ? null : [phrase]);
      } else if (editInfo.topsToShow?.relationshipType === PoeticStructureRelationshipType.MultipleSource) {
        let sources = pendingSources || [];

        if (editState === EditState.EditingExisting && editingStructureId && pendingSources === null) {
          sources = [ ...poeticStructures[editingStructureId].sources ];
        }
        setPendingSources(phrase === null ? null : sources.concat(phrase).sort(sortPhrases));
      }
    }
  }, [editState, editInfo, editingStructureId, pendingSources, setEditState, setPendingRepetition, setPendingSources, setPendingTops]);
  
  const clearAllPending = useCallback(() => {
    setPendingRepetition(null);
    setPendingSources(null);
    setPendingTops(null);
    setEditingStructureId(null);
    setEditState(EditState.Idle);
  }, [setPendingRepetition, setPendingSources, setPendingTops, setEditState, setEditingStructureId]);

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
  }, [editState, poeticStructures, setEditingStructureId]);
  
  const savePendingStructureEdit = useCallback(() => {
    if (
      editState === EditState.CreatingNew
      && editInfo.repetitionToShow && editInfo.sourcesToShow && editInfo.topsToShow
    ) {
      addPoeticStructure(new PoeticStructure(
        editInfo.repetitionToShow,
        editInfo.sourcesToShow,
        editInfo.topsToShow.relationshipType,
        editInfo.topsToShow.id
      ));
      clearAllPending();
    } else if (
      editState === EditState.EditingExisting && editingStructureId
      && editInfo.repetitionToShow && editInfo.sourcesToShow && editInfo.topsToShow
      && (editInfo.repetitionModified || editInfo.sourcesModified || editInfo.topsModified)
    ) {
      replacePoeticStructure(editingStructureId, new PoeticStructure(
        editInfo.repetitionToShow,
        editInfo.sourcesToShow,
        editInfo.topsToShow.relationshipType,
        editInfo.topsToShow.id
      ));
      clearAllPending();
    }
  }, [editState, editingStructureId, editInfo, addPoeticStructure, replacePoeticStructure, clearAllPending]);

  const deleteStructureUnderEdit = useCallback(() => {
    if (editingStructureId) {
      removePoeticStructure(editingStructureId);
    }
    clearAllPending();
  }, [editingStructureId, removePoeticStructure, clearAllPending]);

  const removeSourceFromStructureUnderEdit = useCallback((phraseId: string) => {
    if (editInfo.topsToShow?.relationshipType === PoeticStructureRelationshipType.MultipleSource) {
      let sources = pendingSources || [];

      if (editState === EditState.EditingExisting && editingStructureId && pendingSources === null) {
        sources = [ ...poeticStructures[editingStructureId].sources ];
      }

      setPendingSources(sources.filter(s => s.id !== phraseId));
    }
  }, [editState, editInfo, poeticStructures, editingStructureId, pendingSources, setPendingSources]);

  const value = useMemo(() => ({
    editState, editInfo, setPendingPhrase, setPendingTops, clearAllPending, beginStructureEdit,
    savePendingStructureEdit, deleteStructureUnderEdit, pendingLinePhrases, removeSourceFromStructureUnderEdit
  }), [
    editState, editInfo, setPendingPhrase, setPendingTops, clearAllPending, beginStructureEdit,
    savePendingStructureEdit, deleteStructureUnderEdit, pendingLinePhrases, removeSourceFromStructureUnderEdit
  ]);

  return (
    <StructureEditContext.Provider value={value}>
      { children }
    </StructureEditContext.Provider>
  );
};
