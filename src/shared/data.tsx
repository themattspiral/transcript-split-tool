export interface TypeOfPoeticStructure {
  name: string;
  fullHierarchyName: string;
  selectable: boolean;
  subtypes: TypeOfPoeticStructure[];
}

export interface TranscriptLine {
  lineNumber: number;
  speaker: string;
  text: string;
}

// follows String.substring() behavior - start is inclusive, end is exclusive
export class Phrase {
  constructor(
    public lineNumber: number,
    public start: number,
    public end: number
  ) {}

  get id() {
    return `${this.lineNumber}_${this.start}:${this.end}`;
  }
}

export abstract class AbstractPoeticStructure {
  constructor(
    public type: string,
    public topsNotes: string = '',
    public syntax: string = '',
    public notes: string = ''
  ) {}

  abstract get id(): string;
}

export class PairedStructure extends AbstractPoeticStructure {
  public readonly multipleSources = false;

  constructor(
    public repetition: Phrase, public source: Phrase, type: string = GenericTOPS.fullHierarchyName,
    topsNotes: string = '', syntax: string = '', notes: string = ''
  ) {
    super(type, topsNotes, syntax, notes);
  }

  get id(): string {
    return `${this.repetition.id}--${this.source.id}`;
  }
}

export class MultipleSourcesStructure extends AbstractPoeticStructure {
  public readonly multipleSources = true;

  constructor(
    public repetition: Phrase, public sources: Phrase[], type: string = ConsolidationTOPS.fullHierarchyName,
    topsNotes: string = '', syntax: string = '', notes: string = ''
  ) {
    super(type, topsNotes, syntax, notes);
    this.sources.sort(sortPhrases);
  }

  get id(): string {
    
    return `${this.repetition.id}--${this.sources.map(s => s.id).join('$')}`;
  }
}

export type PoeticStructure = PairedStructure | MultipleSourcesStructure;

export enum PhraseRole {
  Repetition = 'Repetition',
  Source = 'Source'
}

export enum OverallPhraseRole {
  Repetition,
  Source,
  Mixed
}

export interface PhraseLink {
  role: PhraseRole;
  structure: PoeticStructure;
}

export interface PhraseLinkInfo {
  phrase: Phrase;
  overallRole: OverallPhraseRole;
  links: PhraseLink[];
  linkedPhraseIds: string[];
}

export interface PhraseViewState {
  isHovered: boolean;
  isClicked: boolean;
  isDeemphasized: boolean;
  isPending: boolean;
}

export enum PhraseAction {
  Hover,
  Click,
  Context
}

export enum TabId {
  Transcript,
  Structures
}


/******* CONSTANTS *******/
/* These are defined here to avoid circular dependency issues */

export const HEADER_ROW_ID = 'header';

export const GenericTOPS: TypeOfPoeticStructure = {
  name: 'Generic',
  fullHierarchyName: 'Generic',
  selectable: true,
  subtypes: []
};

export const ConsolidationTOPS: TypeOfPoeticStructure = {
  name: 'Consolidation',
  fullHierarchyName: 'Consolidation',
  selectable: true,
  subtypes: []
};

export const DefaultTOPSValues: TypeOfPoeticStructure[] = [
  GenericTOPS,
  ConsolidationTOPS,
  {
    name: 'List',
    fullHierarchyName: 'List',
    selectable: false,
    subtypes: [
      {
        name: 'Single',
        fullHierarchyName: 'List > Single',
        selectable: true,
        subtypes: []
      },
      {
        name: 'Interposed',
        fullHierarchyName: 'List > Interposed',
        selectable: true,
        subtypes: []
      }
    ]
  },
  {
    name: 'Echo',
    fullHierarchyName: 'Echo',
    selectable: false,
    subtypes: [
      {
        name: 'Self-echo',
        fullHierarchyName: 'Echo > Self-echo',
        selectable: true,
        subtypes: []
      },
      {
        name: 'Echo-of-another',
        fullHierarchyName: 'Echo > Echo-of-another',
        selectable: true,
        subtypes: []
      }
    ]
  },
  {
    name: 'Comparison',
    fullHierarchyName: 'Comparison',
    selectable: false,
    subtypes: [
      {
        name: 'Sameness',
        fullHierarchyName: 'Comparison > Sameness',
        selectable: true,
        subtypes: []
      },
      {
        name: 'Difference',
        fullHierarchyName: 'Comparison > Difference',
        selectable: true,
        subtypes: []
      }
    ]
  },
  {
    name: 'Elaboration',
    fullHierarchyName: 'Elaboration',
    selectable: false,
    subtypes: [
      {
        name: 'Elaborating',
        fullHierarchyName: 'Elaboration > Elaborating',
        selectable: true,
        subtypes: []
      },
      {
        name: 'Expanding',
        fullHierarchyName: 'Elaboration > Expanding',
        selectable: true,
        subtypes: []
      }
    ]
  },
  {
    name: 'Reversal',
    fullHierarchyName: 'Reversal',
    selectable: true,
    subtypes: []
  }
];


/******* DATA FUNCTIONS *******/
/* These are defined here to avoid circular dependency issues */

export const getPhraseText = (phrase?: Phrase | null, transcriptLines?: TranscriptLine[]): string | null => {
  let text = null;

  if (phrase && transcriptLines?.length) {
    const phraseLine = transcriptLines[phrase.lineNumber];
    text = phraseLine.text.substring(phrase.start, phrase.end) || '';
  }

  return text;
};

export const sortPhrases = (a: Phrase, b: Phrase): number => {
  if (a.lineNumber < b.lineNumber) return -1;
  else if (a.lineNumber > b.lineNumber) return 1;
  else if (a.start < b.start) return -1;
  else if (a.start > b.start) return 1;
  else if (a.end > b.end) return -1;
  else if (a.end < b.end) return 1;
  else return 0;
};

export const sortPoeticStructures = (a: PoeticStructure, b: PoeticStructure): number => {
  const pSort = sortPhrases(a.repetition, b.repetition);

  if (pSort === 0) {
    let sourceA = {} as Phrase;
    let sourceB = {} as Phrase;

    if (a.multipleSources) {
      sourceA = a.sources[0];
    } else {
      sourceA = a.source;
    }

    if (b.multipleSources) {
      sourceB = b.sources[0];
    } else {
      sourceB = b.source;
    }

    return sortPhrases(sourceA, sourceB);
  } else {
    return pSort;
  }
};
