import { createContext, useCallback, useContext, useMemo, useState } from 'react';

import { PhraseRepetition, TranscriptLine } from '../data/data';
import { getPhraseKey, getPhraseRepetitionKey } from '../util/util';

import repTestData from '../data/reps.data.json';

interface UserDataContextProps {
  // serializable data, provided or defined by user and persisted
  transcriptLines: TranscriptLine[];
  setNewTranscript: (lines: TranscriptLine[]) => void;
  phraseRepetitions: { [key: string]: PhraseRepetition };
  addPhraseRepetition: (rep: PhraseRepetition) => void;
  removePhraseRepetition: (key: string) => void;

  // calculated data
  phraseLinks: { [key: string]: Set<string> };
}

const UserDataContext = createContext<UserDataContextProps>({
  transcriptLines: [],
  setNewTranscript: () => {},
  phraseRepetitions: {},
  addPhraseRepetition: () => {},
  removePhraseRepetition: () => {},
  phraseLinks: {}
});

const useUserData = () => {
  const context = useContext(UserDataContext);
  if (!context) {
    throw new Error(`useUserData must be used within a UserDataProvider`);
  }
  return context;
};

const UserDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [transcriptLines, setTranscriptLines] = useState<TranscriptLine[]>([]);
  const [phraseRepetitions, setPhraseRepetitions] = useState<{ [key: string]: PhraseRepetition }>({});

  // links for all phrases by id to their counterparts by id
  const phraseLinks = useMemo(() => {
    const links = {} as { [key: string]: Set<string> };

    Object.values(phraseRepetitions).forEach(rep => {
      const phraseKey = getPhraseKey(rep.phrase);
      const repKey = getPhraseKey(rep.repeatedPhrase);

      if (!links[phraseKey]) {
        links[phraseKey] = new Set([repKey]);
      } else {
        links[phraseKey].add(repKey);
      }

      if (!links[repKey]) {
        links[repKey] = new Set([phraseKey]);
      } else {
        links[repKey].add(phraseKey);
      }
    });

    return links;
  }, [phraseRepetitions]);

  const setNewTranscript = useCallback((lines: TranscriptLine[]) => {
    setTranscriptLines(lines);
    
    // TEMP: LOAD TEST DATA
    // TODO - replace with saved data load
    setPhraseRepetitions(repTestData);
  }, [setTranscriptLines]);

  const addPhraseRepetition = useCallback((rep: PhraseRepetition) => {
    setPhraseRepetitions(reps => ({
      ...reps, [getPhraseRepetitionKey(rep)]: rep
    }));
  }, [setPhraseRepetitions]);

  const removePhraseRepetition = useCallback((key: string) => {
    setPhraseRepetitions(reps => {
      const r = { ...reps };
      delete r[key];
      return r;
    });
  }, [setPhraseRepetitions]);
  
  const value = useMemo(() => ({
    transcriptLines, setNewTranscript, phraseRepetitions,
    addPhraseRepetition, removePhraseRepetition,
    phraseLinks
  }), [
    transcriptLines, setNewTranscript, phraseRepetitions,
    addPhraseRepetition, removePhraseRepetition,
    phraseLinks
  ]);

  return (
    <UserDataContext.Provider value={value}>
      { children }
    </UserDataContext.Provider>
  );
};

export { UserDataProvider, useUserData };
