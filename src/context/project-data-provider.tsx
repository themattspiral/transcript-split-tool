import { useCallback, useMemo, useState } from 'react';

import {
  DefaultTOPSValues, OverallPhraseRole, Phrase, PhraseLink, PhraseLinkInfo, PhraseRole, 
  PoeticStructure, PoeticStructureRelationshipType, Project, ProjectDataVersion, sortPhrases, TranscriptLine,
  TypeOfPoeticStructure
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
  const [transcriptLines, setTranscriptLines] = useState<TranscriptLine[]>([]);
  const [poeticStructures, setPoeticStructures] = useState<{ [structureId: string]: PoeticStructure }>({});
  const [topsOptions, setTopsOptions] = useState<TypeOfPoeticStructure[]>(DefaultTOPSValues);

  // calculated values:
  //   phraseLinks: mapping from phrase.id (for all defined phrases) to an array
  //                of PhraseLink objects, which each describe 1the associated PoeticStructure
  //                and the role the mapped phrase plays in that structure
  //   
  //   linePhrases: mapping from lineNumber (for all lines with defined phrases)
  //                to array of phrases specific to each line
  const { phraseLinks, linePhrases } = useMemo(() => {
    const phraseMap = {} as { [phraseId: string]: Phrase};
    const uniqueLinks = {} as { [phraseId: string]: { [structureId: string]: PhraseLink } };
    const uniqueLinePhrases = {} as { [lineNumber: string]: { [phraseId: string]: Phrase } };

    Object.values(poeticStructures).forEach(structure => {
      // map the repetition
      if (!uniqueLinks[structure.repetition.id]) {
        uniqueLinks[structure.repetition.id] = {};
      }
      if (!uniqueLinePhrases[structure.repetition.lineNumber.toString()]) {
        uniqueLinePhrases[structure.repetition.lineNumber.toString()] = {};
      }
      phraseMap[structure.repetition.id] = structure.repetition;
      uniqueLinks[structure.repetition.id][structure.id] = { structure, role: PhraseRole.Repetition };
      uniqueLinePhrases[structure.repetition.lineNumber.toString()][structure.repetition.id] = structure.repetition;

      // map the source(s)
      if (structure.relationshipType !== PoeticStructureRelationshipType.Unary) {
        structure.sources.forEach(source => {
          if (!uniqueLinks[source.id]) {
            uniqueLinks[source.id] = {};
          }
          if (!uniqueLinePhrases[source.lineNumber.toString()]) {
            uniqueLinePhrases[source.lineNumber.toString()] = {};
          }
          phraseMap[source.id] = source;
          uniqueLinks[source.id][structure.id] = { structure, role: PhraseRole.Source };
          uniqueLinePhrases[source.lineNumber.toString()][source.id] = source;
        });
      }
    });

    // simplify format
    const links = {} as { [phraseId: string]: PhraseLinkInfo };
    const lines = {} as { [lineNumber: string]: Phrase[] };

    Object.keys(uniqueLinks).forEach(phraseId => {
      const pLinks: PhraseLink[] = Object.values(uniqueLinks[phraseId]);

      const allRepetitions: boolean = pLinks.every(pl => pl.role === PhraseRole.Repetition);
      const allSources: boolean = pLinks.every(pl => pl.role === PhraseRole.Source);
      const overallRole: OverallPhraseRole = allRepetitions
        ? OverallPhraseRole.Repetition
        : (allSources
          ? OverallPhraseRole.Source
          : OverallPhraseRole.Mixed
        );

      const linkedPhraseIdSet: Set<string> = new Set();
      pLinks.forEach(link => {
        linkedPhraseIdSet.add(link.structure.repetition.id);

        if (link.structure.relationshipType !== PoeticStructureRelationshipType.Unary) {
          link.structure.sources.forEach(phrase => {
            linkedPhraseIdSet.add(phrase.id);
          });
        }
      });

      // rollup phrase info
      links[phraseId] = {
        phrase: phraseMap[phraseId],
        overallRole,
        links: pLinks,
        linkedPhraseIds: Array.from(linkedPhraseIdSet)
      };
    });

    Object.keys(uniqueLinePhrases).forEach(lineNumber => {
      lines[lineNumber] = Object.values(uniqueLinePhrases[lineNumber]).sort(sortPhrases);
    });

    return {
      phraseLinks: links,
      linePhrases: lines
    };
  }, [poeticStructures]);

  const getAllPhraseLinks = useCallback((phraseIds: string[]): PhraseLink[] => {
    return Array.from(new Set(
      phraseIds.flatMap((phraseId: string) => phraseLinks[phraseId]?.links || [])
    ));
  }, [phraseLinks]);

  const getAllLinkedPhraseIds = useCallback((phraseIds: string[]): string[] => {
    return Array.from(new Set(
      phraseIds.flatMap((phraseId: string) => phraseLinks[phraseId]?.linkedPhraseIds || [])
    ));
  }, [phraseLinks]);

  const getAllStructurePhraseIds = useCallback((structureId: string): string[] => {
    const structure = poeticStructures[structureId];

    if (structure) {
      const phrases = [structure.repetition, structure.sources].flat();
      return phrases.map(phrase => phrase.id);
    } else {
      return [];
    }
  }, [poeticStructures]);

  const setNewTranscript = useCallback((lines: TranscriptLine[]) => {
    setTranscriptLines(lines);
  }, [setTranscriptLines]);

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
    setNewTranscript(deserializedProject.transcriptLines);
    setTopsOptions(deserializedProject.topsOptions);

    deserializedProject.poeticStructures.forEach(nonClassStructure => {
      const repetition = new Phrase(
        nonClassStructure.repetition.lineNumber,
        nonClassStructure.repetition.start,
        nonClassStructure.repetition.end
      );
      const sources = nonClassStructure.sources.map(source => {
        return new Phrase(
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
  }, [setProjectName, setNewTranscript, setTopsOptions, addPoeticStructure]);

  const unloadProjectData = useCallback(() => {
    setPoeticStructures({});
    setTranscriptLines([]);
    setTopsOptions([]);
    setProjectName(null);
    setProjectFileId(null);
  }, [setProjectFileId, setProjectName, setTranscriptLines, setPoeticStructures, setTopsOptions]);
  
  const value = useMemo(() => ({
    projectFileId, setProjectFileId, projectName, setProjectName,
    transcriptLines, setNewTranscript,
    poeticStructures, addPoeticStructure, replacePoeticStructure, removePoeticStructure,
    phraseLinks, getAllLinkedPhraseIds, getAllPhraseLinks, getAllStructurePhraseIds,
    linePhrases, topsOptions, setTopsOptions, topsMap,
    loadDeserializedProjectData, unloadProjectData
  }), [
    projectFileId, setProjectFileId, projectName, setProjectName,
    transcriptLines, setNewTranscript,
    poeticStructures, addPoeticStructure, replacePoeticStructure, removePoeticStructure,
    phraseLinks, getAllLinkedPhraseIds, getAllPhraseLinks, getAllStructurePhraseIds,
    linePhrases, topsOptions, setTopsOptions, topsMap,
    loadDeserializedProjectData, unloadProjectData
  ]);

  return (
    <ProjectDataContext.Provider value={value}>
      { children }
    </ProjectDataContext.Provider>
  );
};
