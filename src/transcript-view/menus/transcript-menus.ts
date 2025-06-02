import { SpanType } from '../../shared/data';

export enum TranscriptMenuId {
  StructureSelectMenu = 'structure-select-menu-id',
  HighlightMenu = 'highlight-menu-id',
  ErrorMultipleLinesMenu = 'error-multiple-lines-menu-id'
}

export const RepetitionClasses = `split-text-span menu ${SpanType.Repetition}`;
export const SourceClasses = `split-text-span menu ${SpanType.Source}`;
