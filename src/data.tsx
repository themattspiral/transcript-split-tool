const getPhraseKey = (phrase: Phrase): string => {
  return `${phrase.transcriptLineIdx}_${phrase.start}:${phrase.end}`;
};

const getPhraseRepetitionKey = (rep: PhraseRepetition): string => {
  return `${getPhraseKey(rep.phrase)}_${getPhraseKey(rep.repetionOf)}`;
};

const getPhraseLineNumber = (phrase?: Phrase | null, transcriptLines?: TranscriptLine[]): string | null => {
  let lineNumber = null;

  if (phrase && transcriptLines?.length) {
    const phraseLine = transcriptLines[phrase.transcriptLineIdx];
    lineNumber = phraseLine.lineNumber;
  }

  return lineNumber;
};

const getPhraseText = (phrase?: Phrase | null, transcriptLines?: TranscriptLine[]): string | null => {
  let text = null;

  if (phrase && transcriptLines?.length) {
    const phraseLine = transcriptLines[phrase.transcriptLineIdx];
    const phraseLineText = phraseLine.speakerDetected ? phraseLine.textWithoutSpeaker : phraseLine.text;
    text = phraseLineText?.substring(phrase.start, phrase.end) || '';
  }

  return text;
};

const sortPhrases = (a: Phrase, b: Phrase): number => {
  if (a.transcriptLineIdx < b.transcriptLineIdx) return -1;
  else if (a.transcriptLineIdx > b.transcriptLineIdx) return 1;
  else if (a.start < b.start) return -1;
  else if (a.start > b.start) return 1;
  else if (a.end < b.end) return -1;
  else if (a.end > b.end) return 1;
  else return 0;
};

const sortPhraseRepetitions = (a: PhraseRepetition, b: PhraseRepetition): number => {
  const pSort = sortPhrases(a.phrase, b.phrase);
  return pSort === 0 ? sortPhrases(a.repetionOf, b.repetionOf) : pSort;
};

export interface PhraseRepetition {
  phrase: Phrase;
  repetionOf: Phrase;
  note?: string | null;
}

export interface Phrase {
  transcriptLineIdx: number;
  start: number;
  end: number;
  isRepetition: boolean;
}
  
export interface TranscriptLine {
  lineNumber: string;
  text: string;
  speakerDetected: boolean;
  speaker?: string;
  textWithoutSpeaker?: string;
}

export interface GridAction {
  columnId: string;
  transcriptLineIdx: number;
  selectedPhrase?: Phrase;
  textSelection?: Selection;
}

export enum TABS {
  Transcript = 'transcript',
  PhraseBook = 'phrases',
  Poems = 'poems'
}

export {
  getPhraseKey,
  getPhraseRepetitionKey,
  getPhraseLineNumber,
  getPhraseText,
  sortPhrases,
  sortPhraseRepetitions
};
