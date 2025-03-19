export interface ColumnDef {
  id: string;
  label: string;
}

const getPhraseRepetitionKey = (rep: PhraseRepetition): string => {
  return `${rep.phrase.transcriptLineIdx}_${rep.phrase.start}:${rep.phrase.end}`
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

export { getPhraseRepetitionKey };
