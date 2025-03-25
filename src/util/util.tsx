import { Phrase, PhraseRepetition, TranscriptLine } from "../data/data";

const getPhraseKey = (phrase: Phrase): string => {
  return `${phrase.transcriptLineIdx}_${phrase.start}:${phrase.end}:${phrase.isRepetition ? 'r' : ''}`;
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
  else if (a.end > b.end) return -1;
  else if (a.end < b.end) return 1;
  else return 0;
};

const sortPhraseRepetitions = (a: PhraseRepetition, b: PhraseRepetition): number => {
  const pSort = sortPhrases(a.phrase, b.phrase);
  return pSort === 0 ? sortPhrases(a.repetionOf, b.repetionOf) : pSort;
};

const getGridColumnAttributes = (event: React.MouseEvent): NamedNodeMap | undefined => {
  let attrs: NamedNodeMap | undefined = (event.target as HTMLElement).attributes;
  if (!attrs?.length || !attrs.getNamedItem('data-column')) {
    attrs = (event.target as HTMLElement).parentElement?.attributes;
  }
  if (!attrs?.length || !attrs.getNamedItem('data-column')) {
    attrs = (event.target as HTMLElement).parentElement?.parentElement?.attributes;
  }

  return attrs;
};

const TEXT_NODE_NAME = '#text';

const getSelectionRangeContainerAttribute = (node: Node | undefined, attribute: string): string | undefined => {
  if (!node || !attribute) {
    return undefined;
  }

  let value: string | undefined = undefined;
  
  if (node.nodeName === TEXT_NODE_NAME) {
    value = node.parentElement?.attributes?.getNamedItem(attribute)?.value 
  } else {
    value = (node as HTMLElement)?.attributes?.getNamedItem(attribute)?.value;
  }
  return value;
};

export {
  getPhraseKey,
  getPhraseRepetitionKey,
  getPhraseLineNumber,
  getPhraseText,
  sortPhrases,
  sortPhraseRepetitions,
  getGridColumnAttributes,
  getSelectionRangeContainerAttribute
};
