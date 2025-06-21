import { createContext, useContext } from 'react';

import { Phrase, PhraseLink, PhraseLinkInfo, PoeticStructure, TranscriptLine, TypeOfPoeticStructure } from '../shared/data';

interface ProjectDataContextProps {
  projectName: string | null;
  setProjectName: (name: string | null) => void;
  transcriptLines: TranscriptLine[];
  setNewTranscript: (lines: TranscriptLine[]) => void;
  poeticStructures: { [structureId: string]: PoeticStructure };
  addPoeticStructure: (structure: PoeticStructure) => void;
  replacePoeticStructure: (oldStructureId: string, newStructure: PoeticStructure) => void;
  removePoeticStructure: (structureId: string) => void;
  phraseLinks: { [phraseId: string]: PhraseLinkInfo };
  getAllLinkedPhraseIds: (phraseIds: string[]) => string[];
  getAllPhraseLinks: (phraseIds: string[]) => PhraseLink[];
  getAllStructurePhraseIds: (structureId: string) => string[];
  linePhrases: { [lineNumber: string]: Phrase[] };
  topsOptions: TypeOfPoeticStructure[];
  setTopsOptions: (options: TypeOfPoeticStructure[]) => void;
  topsMap: { [topsId: string]: { type: TypeOfPoeticStructure, level: number } };
}

export const ProjectDataContext = createContext<ProjectDataContextProps>({
  projectName: null,
  setProjectName: () => {},
  transcriptLines: [],
  setNewTranscript: () => {},
  poeticStructures: {},
  addPoeticStructure: () => {},
  replacePoeticStructure: () => {},
  removePoeticStructure: () => {},
  phraseLinks: {},
  getAllLinkedPhraseIds: () => [],
  getAllPhraseLinks: () => [],
  getAllStructurePhraseIds: () => [],
  linePhrases: {},
  topsOptions: [],
  setTopsOptions: () => {},
  topsMap: {}
});

export const useProjectData = () => {
  const context = useContext(ProjectDataContext);
  if (!context) {
    throw new Error(`useProjectData must be used within a ProjectDataProvider`);
  }
  return context;
};
