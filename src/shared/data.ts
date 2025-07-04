import { CSSProperties, ReactNode } from 'react';

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
    public topsId: string = GenericTOPS.id,
    public topsNotes: string = '',
    public syntax: string = '',
    public notes: string = ''
  ) {
    // enforce source rules based on type
    if (relationshipType === PoeticStructureRelationshipType.MultipleSource) {
      this.sources = sources.sort(sortPhrases);
    } else if (relationshipType === PoeticStructureRelationshipType.Paired) {
      this.sources = [ sources[0] ];
    } else if (relationshipType === PoeticStructureRelationshipType.Unary) {
      this.sources = [];
    }
  }

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
  isEmphasized: boolean;
  isDeemphasized: boolean;
}

export interface DropdownOption {
  id: string;
  label?: ReactNode;
  textLabel: string;
  selectable?: boolean;
  level?: number;
}

export enum PhraseAction {
  Hover,
  Unhover,
  Click,
  Context
}

export enum MenuAction {
  HoverStructure,
  Unhover,
  Edit,
  Delete
}

export interface TypeOfPoeticStructure {
  id: string;
  displayName: string;
  selectable: boolean;
  subtypes: TypeOfPoeticStructure[];
  relationshipType: PoeticStructureRelationshipType;
  hierarchyDisplayName?: string;
}

export enum SpanType {
  Repetition = 'repetition',
  Source = 'source',
  Overlapping = 'overlapping',
  Text = 'text'
}

export interface SplitTextSpanBubbleDefinition {
  start: number;
  end: number;
  spanPhraseIds: string[];
  spanType: SpanType;
  isUnderEdit: boolean;
  isHoverable: boolean;
  isClickable: boolean;
  isContextable: boolean;
  isEmphasized: boolean;
  isDeemphasized: boolean;
  isLeftmostSpan: boolean;
  isRightmostSpan: boolean;
  isPreviousSpanUnderEdit: boolean;
  isNextSpanUnderEdit: boolean;
}

export interface ValidationResult {
  isCompleteStructure: boolean;
  hasOrderingError: boolean;
}

export interface StylableProps {
  className?: string | undefined;
  style?: CSSProperties | undefined;
}

export enum PersistenceMethod {
  SessionOnly = 'SessionOnly',
  BrowserLocal = 'BrowserLocal',
  GoogleDrive = 'GoogleDrive'
}

export enum PersistenceStatus {
  Initializing = 'Initializing',
  Idle = 'Idle',
  Paused = 'Paused',
  Saving = 'Saving',
  ErrorUnauthorized = 'ErrorUnauthorized',
  ErrorConnect = 'ErrorConnect',
  ErrorData = 'ErrorData'
}

export type PersistenceErrorStatus = 
  | PersistenceStatus.ErrorUnauthorized
  | PersistenceStatus.ErrorConnect
  | PersistenceStatus.ErrorData;

export enum PersistenceEvent {
  Authorized = 'Authorized',
  Initialized = 'Initialized',
  ProjectLoaded = 'ProjectLoaded',
  ProjectSaved = 'ProjectSaved',
  ProjectNotFound = 'ProjectNotFound',
  Error = 'Error'
}

export interface PersistenceResult {
  persistenceStatus: PersistenceStatus;
  lastPersistenceEvent: PersistenceEvent;
}

export enum ProjectDataVersion {
  v1 = 'v1'
}

export interface Project {
  projectName: string;
  transcriptLines: TranscriptLine[];
  poeticStructures: PoeticStructure[];
  topsOptions: TypeOfPoeticStructure[];
  readonly dataVersion: ProjectDataVersion;
}

export enum AppSettingsDataVersion {
  v1 = 'v1'
}

export interface AppSettings {
  persistenceMethod: PersistenceMethod;
  persistenceRememberMe: boolean;
  persistenceFolderName: string | null;
  lastProjectName: string | null;
  readonly dataVersion: AppSettingsDataVersion;
}


/******* CONSTANTS *******/
/* These are defined here to avoid circular dependency issues */

export const HEADER_ROW_ID = 'header';

export const GenericTOPS: TypeOfPoeticStructure = {
  id: 'generic',
  displayName: 'Generic',
  selectable: true,
  subtypes: [],
  relationshipType: PoeticStructureRelationshipType.Paired
};

export const ConsolidationTOPS: TypeOfPoeticStructure = {
  id: 'consolidation',
  displayName: 'Consolidation',
  selectable: true,
  subtypes: [],
  relationshipType: PoeticStructureRelationshipType.MultipleSource
};

export const DefaultTOPSValues: TypeOfPoeticStructure[] = [
  GenericTOPS,
  ConsolidationTOPS,
  {
    id: 'list',
    displayName: 'List',
    selectable: false,
    subtypes: [
      {
        id: 'list-single',
        displayName: 'Single',
        selectable: true,
        subtypes: [],
        relationshipType: PoeticStructureRelationshipType.Unary
      },
      {
        id: 'list-interposed',
        displayName: 'Interposed',
        selectable: true,
        subtypes: [],
        relationshipType: PoeticStructureRelationshipType.Paired
      }
    ],
    relationshipType: PoeticStructureRelationshipType.Paired
  },
  {
    id: 'echo',
    displayName: 'Echo',
    selectable: false,
    subtypes: [
      {
        id: 'echo-self-echo',
        displayName: 'Self-echo',
        selectable: true,
        subtypes: [],
        relationshipType: PoeticStructureRelationshipType.Paired
      },
      {
        id: 'echo-echo-of-another',
        displayName: 'Echo-of-another',
        selectable: true,
        subtypes: [],
        relationshipType: PoeticStructureRelationshipType.Paired
      }
    ],
    relationshipType: PoeticStructureRelationshipType.Paired
  },
  {
    id: 'comparison',
    displayName: 'Comparison',
    selectable: false,
    subtypes: [
      {
        id: 'comparison-sameness',
        displayName: 'Sameness',
        selectable: true,
        subtypes: [],
        relationshipType: PoeticStructureRelationshipType.Paired
      },
      {
        id: 'comparison-difference',
        displayName: 'Difference',
        selectable: true,
        subtypes: [],
        relationshipType: PoeticStructureRelationshipType.Paired
      }
    ],
    relationshipType: PoeticStructureRelationshipType.Paired
  },
  {
    id: 'elaboration',
    displayName: 'Elaboration',
    selectable: false,
    subtypes: [
      {
        id: 'elaboration-elaborating',
        displayName: 'Elaborating',
        selectable: true,
        subtypes: [],
        relationshipType: PoeticStructureRelationshipType.Paired
      },
      {
        id: 'elaboration-expanding',
        displayName: 'Expanding',
        selectable: true,
        subtypes: [],
        relationshipType: PoeticStructureRelationshipType.Paired
      }
    ],
    relationshipType: PoeticStructureRelationshipType.Paired
  },
  {
    id: 'reversal',
    displayName: 'Reversal',
    selectable: true,
    subtypes: [],
    relationshipType: PoeticStructureRelationshipType.Paired
  }
];


/******* DATA FUNCTIONS *******/
/* These are defined here to avoid circular dependency issues */

// TODO - move these out ???

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
