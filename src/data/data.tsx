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

export interface GridAction {
  columnId: string;
  transcriptLineIdx: number;
  selectedPhrase?: Phrase;
  textSelection?: Selection;
}

export enum TabId {
  Transcript,
  PhraseBook,
  Poems,
}

export const HEADER_ROW_ID = 'header';

export enum TranscriptGridColumnId {
  Line = 'line',
  Speaker = 'speaker',
  Text = 'text'
}

export enum PhraseGridColumnId {
  Line = 'line',
  Speaker = 'speaker',
  Text = 'text'
}
