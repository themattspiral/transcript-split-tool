import { createContext, useCallback, useContext, useMemo, useState } from 'react';

import {
  OverallPhraseRole, PairedStructure, Phrase, PhraseLink, PhraseLinkInfo,
  PhraseRole, PoeticStructure, TranscriptLine
} from '../data/data';
import testStructures from '../data/test-structures.data.json';

interface UserDataContextProps {
  transcriptLines: TranscriptLine[];
  setNewTranscript: (lines: TranscriptLine[]) => void;
  poeticStructures: { [psId: string]: PoeticStructure };
  addPoeticStructure: (structure: PoeticStructure) => void;
  removePoeticStructure: (psId: string) => void;
  phraseLinks: { [phraseId: string]: PhraseLinkInfo };
  linePhrases: { [lineNumber: string]: Phrase[] };
}

const UserDataContext = createContext<UserDataContextProps>({
  transcriptLines: [],
  setNewTranscript: () => {},
  poeticStructures: {},
  addPoeticStructure: () => {},
  removePoeticStructure: () => {},
  phraseLinks: {},
  linePhrases: {}
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
  const [poeticStructures, setPoeticStructures] = useState<{ [psId: string]: PoeticStructure }>({});

  // calculated values:
  //   phraseLinks: mapping from phrase.id (for all defined phrases) to an array
  //                of PhraseLink objects, which each describe 1the associated PoeticStructure
  //                and the role the mapped phrase plays in that structure
  //   
  //   linePhrases: mapping from lineNumber (for all lines with defined phrases)
  //                to array of phrases specific to each line
  const { phraseLinks, linePhrases } = useMemo(() => {
    // internal versions use object keys to track uniqueness while populating
    const uniqueLinks = {} as { [phraseId: string]: { [psId: string]: PhraseLink } };
    const uniqueLinePhrases = {} as { [lineNumber: string]: { [phraseId: string]: Phrase } };

    Object.values(poeticStructures).forEach(structure => {
      // map the repetition
      if (!uniqueLinks[structure.repetition.id]) {
        uniqueLinks[structure.repetition.id] = {};
      }
      if (!uniqueLinePhrases[structure.repetition.lineNumber.toString()]) {
        uniqueLinePhrases[structure.repetition.lineNumber.toString()] = {};
      }
      uniqueLinks[structure.repetition.id][structure.id] = { structure, role: PhraseRole.Repetition };
      uniqueLinePhrases[structure.repetition.lineNumber.toString()][structure.repetition.id] = structure.repetition;

      // map the source(s)
      if (structure.multipleSources) {
        structure.sources.forEach(source => {
          if (!uniqueLinks[source.id]) {
            uniqueLinks[source.id] = {};
          }
          if (!uniqueLinePhrases[source.lineNumber.toString()]) {
            uniqueLinePhrases[source.lineNumber.toString()] = {};
          }
          uniqueLinks[source.id][structure.id] = { structure, role: PhraseRole.Source };
          uniqueLinePhrases[source.lineNumber.toString()][source.id] = source;
        });
      } else {
        if (!uniqueLinks[structure.source.id]) {
          uniqueLinks[structure.source.id] = {};
        }
        if (!uniqueLinePhrases[structure.source.lineNumber.toString()]) {
          uniqueLinePhrases[structure.source.lineNumber.toString()] = {};
        }
        uniqueLinks[structure.source.id][structure.id] = { structure, role: PhraseRole.Source };
        uniqueLinePhrases[structure.source.lineNumber.toString()][structure.source.id] = structure.source;
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
        if (link.structure.multipleSources) {
          link.structure.sources.forEach(phrase => {
            linkedPhraseIdSet.add(phrase.id);
          });
        } else {
          linkedPhraseIdSet.add(link.structure.source.id);
        }
      });

      // rollup phrase info
      links[phraseId] = {
        overallRole,
        links: pLinks,
        linkedPhraseIds: Array.from(linkedPhraseIdSet)
      };
    });

    Object.keys(uniqueLinePhrases).forEach(lineNumber => {
      lines[lineNumber] = Object.values(uniqueLinePhrases[lineNumber]);
    });

    return {
      phraseLinks: links,
      linePhrases: lines
    };
  }, [poeticStructures]);

  const setNewTranscript = useCallback((lines: TranscriptLine[]) => {
    setTranscriptLines(lines);
    
    // TEMP: LOAD TEST DATA
    // TODO - replace with saved data load

    Object.entries(testStructures).forEach(([psId, ps]) => {
      const repetition = new Phrase(
        ps.repetition.lineNumber,
        ps.repetition.start,
        ps.repetition.end
      );
      const source = new Phrase(
        ps.source.lineNumber,
        ps.source.start,
        ps.source.end
      );
      
      const structure: PairedStructure = new PairedStructure(
        repetition, source, ps.type, ps.topsNotes, ps.syntax, ps.notes
      );
      
      delete (testStructures as { [id: string]: any })[psId];

      (testStructures as { [id: string]: any })[structure.id] = structure;
    })
    
    setPoeticStructures(testStructures as { [id: string]: any });
  }, [setTranscriptLines, setPoeticStructures]);

  const addPoeticStructure = useCallback((newStructure: PoeticStructure) => {
    setPoeticStructures(structures => ({
      ...structures,
      [newStructure.id]: newStructure
    }));
  }, [setPoeticStructures]);

  const removePoeticStructure = useCallback((psId: string) => {
    setPoeticStructures(structures => {
      const newStructures = { ...structures };
      delete newStructures[psId];
      return newStructures;
    });
  }, [setPoeticStructures]);
  
  const value = useMemo(() => ({
    transcriptLines, setNewTranscript,
    poeticStructures, addPoeticStructure, removePoeticStructure,
    phraseLinks, linePhrases
  }), [
    transcriptLines, setNewTranscript,
    poeticStructures, addPoeticStructure, removePoeticStructure,
    phraseLinks, linePhrases
  ]);

  return (
    <UserDataContext.Provider value={value}>
      { children }
    </UserDataContext.Provider>
  );
};

export { UserDataProvider, useUserData };
