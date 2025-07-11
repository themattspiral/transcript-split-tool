import { createContext, useContext } from 'react';

import { Phrase, PhraseLink, PhraseLinkInfo, PoeticStructure, Project, Transcript, TypeOfPoeticStructure } from 'data';

interface ProjectDataContextProps {
  projectFileId: string | null;
  setProjectFileId: (projectFileId: string | null) => void;
  projectName: string | null;
  setProjectName: (name: string | null) => void;
  transcripts: Transcript[];
  addTranscript: (transcript: Transcript) => void;
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
  loadDeserializedProjectData: (deserializedProject: Project) => void;
  unloadProjectData: () => void;
}

export const ProjectDataContext = createContext<ProjectDataContextProps>({
  projectFileId: null,
  setProjectFileId: () => {},
  projectName: null,
  setProjectName: () => {},
  transcripts: [],
  addTranscript: () => {},
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
  topsMap: {},
  loadDeserializedProjectData: () => {},
  unloadProjectData: () => {}
});

export const useProjectData = () => {
  const context = useContext(ProjectDataContext);
  if (!context) {
    throw new Error(`useProjectData must be used within a ProjectDataProvider`);
  }
  return context;
};
