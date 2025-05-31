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

export enum PoeticStructureRelationshipType {
  Unary = 'Unary',
  Paired = 'Paired',
  MultipleSource = 'MultipleSource'
}

export class PoeticStructure {
  constructor(
    public repetition: Phrase,
    public sources: Phrase[],
    public relationshipType: PoeticStructureRelationshipType = PoeticStructureRelationshipType.Paired,
    public tops: string = GenericTOPS.fullHierarchyName,
    public topsNotes: string = '',
    public syntax: string = '',
    public notes: string = ''
  ) {}

  get id(): string {
    switch (this.relationshipType) {
      case PoeticStructureRelationshipType.Paired:
        return `${this.repetition.id}--${this.sources[0].id}`;
      case PoeticStructureRelationshipType.MultipleSource:
        return `${this.repetition.id}--${this.sources.map(s => s.id).join('$')}`;
      case PoeticStructureRelationshipType.Unary:
        return `${this.repetition.id}--unary`;
    }
  }
}

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
  Unhover,
  Click,
  Context
}

export enum MenuAction {
  HoverStructure,
  HoverPhrase,
  Unhover,
  Click
}

export enum TabId {
  Transcript,
  Structures
}

export interface TypeOfPoeticStructure {
  name: string;
  fullHierarchyName: string;
  selectable: boolean;
  subtypes: TypeOfPoeticStructure[];
  relationshipType: PoeticStructureRelationshipType;
}


/******* CONSTANTS *******/
/* These are defined here to avoid circular dependency issues */

export const HEADER_ROW_ID = 'header';

export const GenericTOPS: TypeOfPoeticStructure = {
  name: 'Generic',
  fullHierarchyName: 'Generic',
  selectable: true,
  subtypes: [],
  relationshipType: PoeticStructureRelationshipType.Paired
};

export const ConsolidationTOPS: TypeOfPoeticStructure = {
  name: 'Consolidation',
  fullHierarchyName: 'Consolidation',
  selectable: true,
  subtypes: [],
  relationshipType: PoeticStructureRelationshipType.MultipleSource
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
        subtypes: [],
        relationshipType: PoeticStructureRelationshipType.Unary
      },
      {
        name: 'Interposed',
        fullHierarchyName: 'List > Interposed',
        selectable: true,
        subtypes: [],
        relationshipType: PoeticStructureRelationshipType.Paired
      }
    ],
    relationshipType: PoeticStructureRelationshipType.Paired
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
        subtypes: [],
        relationshipType: PoeticStructureRelationshipType.Paired
      },
      {
        name: 'Echo-of-another',
        fullHierarchyName: 'Echo > Echo-of-another',
        selectable: true,
        subtypes: [],
        relationshipType: PoeticStructureRelationshipType.Paired
      }
    ],
    relationshipType: PoeticStructureRelationshipType.Paired
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
        subtypes: [],
        relationshipType: PoeticStructureRelationshipType.Paired
      },
      {
        name: 'Difference',
        fullHierarchyName: 'Comparison > Difference',
        selectable: true,
        subtypes: [],
        relationshipType: PoeticStructureRelationshipType.Paired
      }
    ],
    relationshipType: PoeticStructureRelationshipType.Paired
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
        subtypes: [],
        relationshipType: PoeticStructureRelationshipType.Paired
      },
      {
        name: 'Expanding',
        fullHierarchyName: 'Elaboration > Expanding',
        selectable: true,
        subtypes: [],
        relationshipType: PoeticStructureRelationshipType.Paired
      }
    ],
    relationshipType: PoeticStructureRelationshipType.Paired
  },
  {
    name: 'Reversal',
    fullHierarchyName: 'Reversal',
    selectable: true,
    subtypes: [],
    relationshipType: PoeticStructureRelationshipType.Paired
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

const sortPhrasesByLineNumber = (a: Phrase, b: Phrase): number => {
  if (a.lineNumber < b.lineNumber) return -1;
  else if (a.lineNumber > b.lineNumber) return 1;
  else return 0;
};

export const sortPoeticStructures = (a: PoeticStructure, b: PoeticStructure): number => {
  const repetitionLineSort = sortPhrasesByLineNumber(a.repetition, b.repetition);

  if (repetitionLineSort === 0) {
    if (
      a.relationshipType === PoeticStructureRelationshipType.Unary
      && b.relationshipType !== PoeticStructureRelationshipType.Unary
    ) {
        return -1;
    } else if (
      a.relationshipType !== PoeticStructureRelationshipType.Unary
      && b.relationshipType === PoeticStructureRelationshipType.Unary
    ) {
      return 1;
    } else if (
      a.relationshipType === PoeticStructureRelationshipType.Unary
      && b.relationshipType === PoeticStructureRelationshipType.Unary
    ) {
      return 0;
    } else {
      const sourceLineSort = sortPhrasesByLineNumber(a.sources[0], b.sources[0]);
      
      if (sourceLineSort === 0) {
        const repFullSort = sortPhrases(a.repetition, b.repetition);

        if (repFullSort === 0) {
          return sortPhrases(a.sources[0], b.sources[0])
        } else {
          return repFullSort;
        }
      } else {
        return sourceLineSort;
      }
    }
  } else {
    return repetitionLineSort;
  }
};
