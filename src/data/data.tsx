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
  isPending: boolean;
}
  
export interface TranscriptLine {
  lineNumber: string;
  text: string;
  speakerDetected: boolean;
  speaker?: string;
  textWithoutSpeaker?: string;
}

export enum TabId {
  Transcript,
  PhraseBook,
  Poems,
}

export const HEADER_ROW_ID = 'header';
