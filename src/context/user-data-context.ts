import { createContext, useContext } from 'react';

import { Phrase, PhraseLink, PhraseLinkInfo, PoeticStructure, TranscriptLine, TypeOfPoeticStructure } from '../shared/data';

interface UserDataContextProps {
  transcriptLines: TranscriptLine[];
  setNewTranscript: (lines: TranscriptLine[]) => void;
  poeticStructures: { [structureId: string]: PoeticStructure };
  addPoeticStructure: (structure: PoeticStructure) => void;
  removePoeticStructure: (structureId: string) => void;
  phraseLinks: { [phraseId: string]: PhraseLinkInfo };
  getAllLinkedPhraseIds: (phraseIds: string[]) => string[];
  getAllPhraseLinks: (phraseIds: string[]) => PhraseLink[];
  getAllStructurePhraseIds: (structureId: string) => string[];
  linePhrases: { [lineNumber: string]: Phrase[] };
  topsOptions: TypeOfPoeticStructure[];
  topsMap: { [topsId: string]: TypeOfPoeticStructure };
}

export const UserDataContext = createContext<UserDataContextProps>({
  transcriptLines: [],
  setNewTranscript: () => {},
  poeticStructures: {},
  addPoeticStructure: () => {},
  removePoeticStructure: () => {},
  phraseLinks: {},
  getAllLinkedPhraseIds: () => [],
  getAllPhraseLinks: () => [],
  getAllStructurePhraseIds: () => [],
  linePhrases: {},
  topsOptions: [],
  topsMap: {}
});

export const useUserData = () => {
  const context = useContext(UserDataContext);
  if (!context) {
    throw new Error(`useUserData must be used within a UserDataProvider`);
  }
  return context;
};
