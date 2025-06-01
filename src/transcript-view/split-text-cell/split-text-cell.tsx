import { CSSProperties, useMemo } from 'react';
import classnames from 'classnames';

import { OverallPhraseRole, Phrase, PhraseAction, PhraseLinkInfo, SpanType, TranscriptLine } from '../../shared/data';
import { useUserData } from '../../context/user-data-context';
import { useTranscriptInteraction } from '../../context/transcript-interaction-context';

interface SpanDefinition {
  start: number;
  end: number;
  spanPhraseIds: string[];
  spanType: SpanType;
  isPending: boolean;
  isHoverable: boolean;
  isClickable: boolean;
  isContextable: boolean;
  isHovered: boolean;
  isClicked: boolean;
  isDeemphasized: boolean;
  classes?: string;
}

interface SplitTextCellProps {
  line: TranscriptLine;
  className?: string;
  style?: CSSProperties;
  attributes?: any;
}

const SplitTextCell: React.FC<SplitTextCellProps> = props => {
  const { line, className, style, attributes } = props;

  const { phraseLinks, linePhrases } = useUserData();
  const { phraseViewStates, handlePhraseAction } = useTranscriptInteraction();

  // flatten plain text and phrases into discreet SpanDefinitions, handling potential range overlaps 
  const spanDefinitions: SpanDefinition[] = useMemo(() => {
    const thisLinesPhrases = linePhrases[line.lineNumber.toString()] || [];
    const idxSpanSplitPoints = new Set<number>([0, line.text.length]);

    thisLinesPhrases?.forEach(phrase => {
      idxSpanSplitPoints.add(phrase.start);
      idxSpanSplitPoints.add(phrase.end);
    });

    const definitions: SpanDefinition[] = [];

    // create discrete ranges/spans/sections between adjacent points
    const sortedPoints = Array.from(idxSpanSplitPoints).sort((a, b) => a - b);
    
    for (let i = 0; i < sortedPoints.length - 1; i++) {
      const start = sortedPoints[i];
      const end = sortedPoints[i + 1];
      
      // find which phrases in this line are associated with this particular span
      const spanPhrases: Phrase[] = [];
      
      thisLinesPhrases?.forEach(phrase => {
        // A phrase covers this span if:
        // 1. the phrase's start is less than this span's end
        // 2. the phrase's end is greater than this span's start
        //
        // i.e. fully contained, or overlapping on either side
        if (phrase.start < end && phrase.end > start) {
          spanPhrases.push(phrase);
        }
      });

      // TODO pending logic
      let isPending = false;
      // pending = phraseAssociations[0].phrase.isPending;

      // determine span type
      let spanType = SpanType.Text;

      if (spanPhrases.length === 1) {
        const linkInfo: PhraseLinkInfo = phraseLinks[spanPhrases[0].id];

        if (linkInfo.overallRole === OverallPhraseRole.Mixed) {
          spanType = SpanType.Overlapping;
        } else if (linkInfo.overallRole === OverallPhraseRole.Repetition) {
          spanType = SpanType.Repetition;
        } else if (linkInfo.overallRole === OverallPhraseRole.Source) {
          spanType = SpanType.Source;
        }
      } else if (spanPhrases.length > 1) {
        spanType = SpanType.Overlapping;
      }

      const isNotTextType = spanType !== SpanType.Text;

      // determine this span's view state based on the collective 
      // view states of the phrases that it's a part of
      let isHovered = false;
      let isClicked = false;
      let isDeemphasized = true;

      if (isNotTextType) {
        spanPhrases.forEach(phrase => {
          isHovered ||= phraseViewStates[phrase.id]?.isHovered;             // some
          isClicked ||= phraseViewStates[phrase.id]?.isClicked;             // some
          isDeemphasized &&= phraseViewStates[phrase.id]?.isDeemphasized;   // every
        });
      }

      definitions.push({
        start,
        end,
        spanPhraseIds: spanPhrases.map(p => p.id),
        spanType,
        isPending,
        isHoverable: isNotTextType,
        isClickable: isNotTextType,
        isContextable: isNotTextType,
        isHovered,
        isClicked,
        isDeemphasized
      });
    }

    // determine styling for each span (some of these look at neighbors, and so require all spans to be defined first)
    for (let i = 0; i < definitions.length; i++) {
      const spanType = definitions[i].spanType;
      const isLeftmostSpan = spanType !== SpanType.Text && (i === 0 || definitions[i - 1].spanType === SpanType.Text);
      const isRightmostSpan = spanType !== SpanType.Text && (i === (definitions.length - 1) || definitions[i + 1].spanType === SpanType.Text);
      const isLeftmostClicked = definitions[i].isClicked && i > 0 && !definitions[i - 1].isClicked;
      const isRightmostClicked = definitions[i].isClicked && i < (definitions.length - 1) && !definitions[i + 1].isClicked;
      const isPreviousClicked = !definitions[i].isClicked && i > 0 && definitions[i - 1].isClicked;

      definitions[i].classes = classnames(
        'split-text-span',
        spanType, // SpanType string enum values match class names in scss file
        { clickable: definitions[i].isClickable },
        { pending: definitions[i].isPending },
        { hovered: definitions[i].isHovered },          // TODO change to emphasized
        { clicked: definitions[i].isClicked },          // TODO change to selected
        { deemphasized: definitions[i].isDeemphasized },
        { leftmost: isLeftmostSpan },
        { rightmost: isRightmostSpan },
        { ['leftmost-clicked']: isLeftmostClicked },
        { ['rightmost-clicked']: isRightmostClicked },
        { ['previous-clicked']: isPreviousClicked }
      );
    }
    return definitions;
  }, [line, linePhrases, phraseViewStates, phraseLinks]);

  // map definintions to actual span elements
  const spanElements = useMemo(() => spanDefinitions.map(span => (
    <span
      key={`${span.start}:${span.end}`}
      className={span.classes}
      data-pls-idx={span.start}
      onMouseOver={span.isHoverable ? (event: React.MouseEvent) => {
        handlePhraseAction(event, span.spanPhraseIds, PhraseAction.Hover);
      } : undefined}
      onMouseOut={span.isHoverable ? (event: React.MouseEvent) => {
        handlePhraseAction(event, span.spanPhraseIds, PhraseAction.Unhover);
      } : undefined}
      onClick={span.isClickable ? (event: React.MouseEvent) => {
        event.stopPropagation();
        handlePhraseAction(event, span.spanPhraseIds, PhraseAction.Click);
      } : undefined}
      // note: only existing phrase-type spans get their context menu event handled here. the text-type span 
      //   context menu event is allowed to propagate down, and is handled by TranscriptGrid because 
      //   it can see across spans and lines to handle edge cases
      onContextMenu={span.isContextable ? (event: React.MouseEvent) => {
        event.stopPropagation();
        if (event.preventDefault) event.preventDefault();
        handlePhraseAction(event, span.spanPhraseIds, PhraseAction.Context);
      } : undefined}
    >
      { line.text.substring(span.start, span.end) }
    </span>
  )), [spanDefinitions, handlePhraseAction]);

  return (
    <div className={classnames('px-2 py-2 relative whitespace-pre-wrap', className)} style={style} {...attributes}>
      { spanElements }
    </div>
  );
};

export { SplitTextCell };
