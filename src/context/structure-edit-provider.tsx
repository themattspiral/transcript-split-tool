import { useCallback, useMemo, useState } from 'react';

import {
  PoeticStructure, Phrase, PhraseRole, TypeOfPoeticStructure, GenericTOPS,
  PoeticStructureRelationshipType, sortPhrases, ValidationResult
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
      topsModified,
      anyModified: repetitionModified || sourcesModified || topsModified
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

  const editValidity = useMemo(() => {
    let result: ValidationResult = { isCompleteStructure: false, hasOrderingError: false };

    if (editInfo.topsToShow?.relationshipType === PoeticStructureRelationshipType.Unary) {
      result.isCompleteStructure = !!editInfo.repetitionToShow && !!editInfo.topsToShow;
    } else {
      result.isCompleteStructure = !!editInfo.repetitionToShow && !!editInfo.topsToShow
        && !!editInfo.sourcesToShow && editInfo.sourcesToShow.length >= 1;
    }

    if (result.isCompleteStructure) {
      editInfo.sourcesToShow?.forEach(source => {
        const isSameLine = editInfo.repetitionToShow?.lineNumber === source.lineNumber;
        const hasOrderingError: boolean = !!editInfo.repetitionToShow && (
          source.lineNumber > editInfo.repetitionToShow.lineNumber
          || (isSameLine && editInfo.repetitionToShow.start < source.end)
        );
        result.hasOrderingError ||= hasOrderingError;
      });
    }

    return result;
  }, [editInfo]);

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
      && editInfo.repetitionToShow && editInfo.topsToShow
    ) {
      addPoeticStructure(new PoeticStructure(
        editInfo.repetitionToShow,
        editInfo.sourcesToShow || [],
        editInfo.topsToShow.relationshipType,
        editInfo.topsToShow.id
      ));
      clearAllPending();
    } else if (
      editState === EditState.EditingExisting && editingStructureId
      && editInfo.repetitionToShow && editInfo.topsToShow
    ) {
      const editingStructure = poeticStructures[editingStructureId];
      replacePoeticStructure(editingStructureId, new PoeticStructure(
        editInfo.repetitionToShow,
        editInfo.sourcesToShow || [],
        editInfo.topsToShow.relationshipType,
        editInfo.topsToShow.id,
        editingStructure.topsNotes,
        editingStructure.syntax,
        editingStructure.notes
      ));
      clearAllPending();
    }
  }, [
    editState, editingStructureId, editInfo, poeticStructures, 
    addPoeticStructure, replacePoeticStructure, clearAllPending
  ]);

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
    editState, editInfo, editValidity, pendingLinePhrases, setPendingPhrase, setPendingTops, clearAllPending,
    beginStructureEdit, savePendingStructureEdit, deleteStructureUnderEdit, removeSourceFromStructureUnderEdit
  }), [
    editState, editInfo, editValidity, pendingLinePhrases, setPendingPhrase, setPendingTops, clearAllPending,
    beginStructureEdit, savePendingStructureEdit, deleteStructureUnderEdit, removeSourceFromStructureUnderEdit
  ]);

  return (
    <StructureEditContext.Provider value={value}>
      { children }
    </StructureEditContext.Provider>
  );
};
