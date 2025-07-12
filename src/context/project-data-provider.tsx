import { useCallback, useMemo, useState } from 'react';

import {
  DefaultTOPSValues, Phrase, PoeticStructure, PoeticStructureRelationshipType,
  Project, ProjectDataVersion, Transcript, TypeOfPoeticStructure
} from 'data';
import { ProjectDataContext } from './project-data-context';

const flattenTops = (option: TypeOfPoeticStructure, level: number, parentHierarchyDisplayName?: string) => {
  let map = { [option.id]: { type: option, level } } as { [topsId: string]: { type: TypeOfPoeticStructure, level: number } };

  if (parentHierarchyDisplayName) {
    option.hierarchyDisplayName = `${parentHierarchyDisplayName} > ${option.displayName}`;
  } else {
    option.hierarchyDisplayName = option.displayName;
  }

  if (option.subtypes.length > 0) {
    option.subtypes.forEach(subtype => {
      map = { ...map, ...flattenTops(subtype, level + 1, option.hierarchyDisplayName) };
    });
  }
  return map;
};

export const ProjectDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [projectFileId, setProjectFileId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState<string | null>(null);
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [poeticStructures, setPoeticStructures] = useState<{ [structureId: string]: PoeticStructure }>({});
  const [topsOptions, setTopsOptions] = useState<TypeOfPoeticStructure[]>(DefaultTOPSValues);

  const getAllStructurePhraseIds = useCallback((structureId: string): string[] => {
    const structure = poeticStructures[structureId];

    if (structure) {
      const phrases = [structure.repetition, structure.sources].flat();
      return phrases.map(phrase => phrase.id);
    } else {
      return [];
    }
  }, [poeticStructures]);

  const addPoeticStructure = useCallback((newStructure: PoeticStructure) => {
    setPoeticStructures(structures => ({
      ...structures,
      [newStructure.id]: newStructure
    }));
  }, [setPoeticStructures]);

  const replacePoeticStructure = useCallback((oldStructureId: string, newStructure: PoeticStructure) => {
    setPoeticStructures(structures => {
      const newStructures = { ...structures };
      delete newStructures[oldStructureId];
      newStructures[newStructure.id] = newStructure;

      return newStructures;
    });
  }, [setPoeticStructures]);

  const removePoeticStructure = useCallback((structureId: string) => {
    setPoeticStructures(structures => {
      const newStructures = { ...structures };
      delete newStructures[structureId];
      return newStructures;
    });
  }, [setPoeticStructures]);

  const topsMap = useMemo(() => {
    let map = {} as { [topsId: string]: { type: TypeOfPoeticStructure, level: number } };

    topsOptions.forEach(option => {
      map = { ...map, ...flattenTops(option, 0) };
    });

    return map;
  }, [topsOptions]);

  const loadDeserializedProjectData = useCallback((deserializedProject: Project) => {
    // TODO - SCRUB POTENTIALLY DANGEROUS INPUT

    // in the future, handle upgrade of older data versions here if needed
    if (deserializedProject?.dataVersion !== ProjectDataVersion.v1) {
      throw new Error(`Cannot parse project dataVersion: ${deserializedProject?.dataVersion}`);
    }
    
    setProjectName(deserializedProject.projectName);
    setTranscripts(deserializedProject.transcripts);
    setTopsOptions(deserializedProject.topsOptions);

    deserializedProject.poeticStructures.forEach(nonClassStructure => {
      const repetition = new Phrase(
        nonClassStructure.repetition.transcriptId,
        nonClassStructure.repetition.lineNumber,
        nonClassStructure.repetition.start,
        nonClassStructure.repetition.end
      );
      const sources = nonClassStructure.sources.map(source => {
        return new Phrase(
          source.transcriptId,
          source.lineNumber,
          source.start,
          source.end
        );
      });
      
      const structure = new PoeticStructure(
        repetition, sources, nonClassStructure.relationshipType as PoeticStructureRelationshipType,
        nonClassStructure.topsId, nonClassStructure.topsNotes, nonClassStructure.syntax, nonClassStructure.notes
      );
      
      addPoeticStructure(structure);
    });
  }, [setProjectName, setTranscripts, setTopsOptions, addPoeticStructure]);

  const addTranscript = useCallback((transcript: Transcript) => {
    setTranscripts(t => t.concat(transcript));
  }, [setTranscripts]);

  const unloadProjectData = useCallback(() => {
    setPoeticStructures({});
    setTranscripts([]);
    setTopsOptions([]);
    setProjectName(null);
    setProjectFileId(null);
  }, [setProjectFileId, setProjectName, setTranscripts, setPoeticStructures, setTopsOptions]);
  
  const value = useMemo(() => ({
    projectFileId, setProjectFileId, projectName, setProjectName,
    transcripts, addTranscript,
    poeticStructures, addPoeticStructure, replacePoeticStructure, removePoeticStructure,
    getAllStructurePhraseIds,
    topsOptions, setTopsOptions, topsMap,
    loadDeserializedProjectData, unloadProjectData
  }), [
    projectFileId, setProjectFileId, projectName, setProjectName,
    transcripts, addTranscript,
    poeticStructures, addPoeticStructure, replacePoeticStructure, removePoeticStructure,
    getAllStructurePhraseIds,
    topsOptions, setTopsOptions, topsMap,
    loadDeserializedProjectData, unloadProjectData
  ]);

  return (
    <ProjectDataContext.Provider value={value}>
      { children }
    </ProjectDataContext.Provider>
  );
};
