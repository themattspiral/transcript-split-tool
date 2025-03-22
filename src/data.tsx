const getPhraseKey = (phrase: Phrase): string => {
  return `${phrase.transcriptLineIdx}_${phrase.start}:${phrase.end}`;
};

const getPhraseRepetitionKey = (rep: PhraseRepetition): string => {
  return `${getPhraseKey(rep.phrase)}_${getPhraseKey(rep.repetionOf)}`;
};

// sorting
const byStart = (a: Phrase, b: Phrase): number => {
  if (a.start < b.start) return -1;
  else if (a.start > b.start) return 1;
  else return 0;
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

export interface GridClickState {
  columnId: string;
  transcriptLineIdx: number;
  textSelection?: Selection | null;
  textSelectionString?: string;
  linePartIdx?: number;
}

export enum TABS {
  Transcript = 'transcript',
  PhraseBook = 'phrases',
  Poems = 'poems'
}

export { getPhraseKey, getPhraseRepetitionKey, byStart };
