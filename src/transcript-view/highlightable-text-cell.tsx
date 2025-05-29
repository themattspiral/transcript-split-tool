import { CSSProperties, useMemo } from "react";
import classnames from "classnames";

import './highlightable-text-cell.scss';
import { OverallPhraseRole, Phrase, PhraseAction, TranscriptLine } from "../data/data";
import { useUserData } from "../context/user-data-context";
import { useTranscriptInteraction } from "../context/transcript-interaction-context";

enum TextSpanType {
  Repetition = 'repetition',
  Source = 'source',
  Overlapping = 'overlapping',
  Text = 'text'
}

interface TextSpan {
  start: number;
  end: number;
  spanPhraseIds: string[];
  spanType: TextSpanType;
  isPending: boolean;
  isHoverable: boolean;
  isClickable: boolean;
  isContextable: boolean;
  isHovered: boolean;
  isClicked: boolean;
  isDeemphasized: boolean;
  displayRefCount?: number;
  classes?: string;
}

interface HighlightableTextCellProps {
  line: TranscriptLine;
  className?: string;
  style?: CSSProperties;
  attributes?: any;
}

const HighlightableTextCell: React.FC<HighlightableTextCellProps> = props => {
  const { line, className, style, attributes } = props;

  const { phraseLinks, linePhrases } = useUserData();
  const { phraseViewStates, handlePhraseAction, clearHover } = useTranscriptInteraction();

  // flatten plain text and phrases into discreet TextSpans, handling potential range overlaps 
  const textSpans: TextSpan[] = useMemo(() => {
    const thisLinesPhrases = Object.values(linePhrases[line.lineNumber.toString()] || {});
    const idxSpanSplitPoints = new Set<number>([0, line.text.length]);

    thisLinesPhrases?.forEach(phrase => {
      idxSpanSplitPoints.add(phrase.start);
      idxSpanSplitPoints.add(phrase.end);
    });

    const sortedPoints = Array.from(idxSpanSplitPoints).sort((a, b) => a - b);

    // create discrete ranges/spans/sections between adjacent points
    const spans: TextSpan[] = [];
    
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

      let pending = false;
      let spanType = TextSpanType.Text;
      let refCount = undefined;

      if (spanPhrases.length === 1) {
        const linkInfo = phraseLinks[spanPhrases[0].id];

        if (linkInfo.overallRole === OverallPhraseRole.Mixed) {
          spanType = TextSpanType.Overlapping;
        } else if (linkInfo.overallRole === OverallPhraseRole.Repetition) {
          spanType = TextSpanType.Repetition;
        } else if (linkInfo.overallRole === OverallPhraseRole.Source) {
          spanType = TextSpanType.Source;
        }

        // TODO pending logic
        // pending = phraseAssociations[0].phrase.isPending;
        
        // TODO - decide if we want to keep the refcount badge
        refCount = linkInfo.links.length;
        // if (spanType === TextSpanType.RepeatedPhrase) {
        //   refCount = linkInfo.links.length;
        // }
      } else if (spanPhrases.length > 1) {
        spanType = TextSpanType.Overlapping;
      }

      let isHovered = false;
      let isClicked = false;
      let isDeemphasized = true;

      if (spanType != TextSpanType.Text) {

        spanPhrases.forEach(phrase => {
          isHovered ||= phraseViewStates[phrase.id]?.isHovered;             // some
          isClicked ||= phraseViewStates[phrase.id]?.isClicked;             // some
          isDeemphasized &&= phraseViewStates[phrase.id]?.isDeemphasized;   // every
        });
      }

      // TODO pending logic
      const isPending = false;

      const isNotText = spanType !== TextSpanType.Text;
      
      spans.push({
        start,
        end,
        spanPhraseIds: spanPhrases.map(p => p.id),
        spanType,
        isPending,
        isHoverable: isNotText,
        isClickable: isNotText,
        isContextable: isNotText,
        isHovered,
        isClicked,
        isDeemphasized,
        displayRefCount: pending ? (refCount || 0) + 1 : refCount
      });
    }

    // determine styling for each span
    for (let i = 0; i < spans.length; i++) {
      const spanType = spans[i].spanType;
      const isLeftmostPhrase = spanType != TextSpanType.Text && (i === 0 || spans[i - 1].spanType === TextSpanType.Text);
      const isRightmostPhrase = spanType != TextSpanType.Text && (i === (spans.length - 1) || spans[i + 1].spanType === TextSpanType.Text);
      const leftmostClicked = spans[i].isClicked && i > 0 && !spans[i - 1].isClicked;
      const rightmostClicked = spans[i].isClicked && i < (spans.length - 1) && !spans[i + 1].isClicked;

      spans[i].classes = classnames(
        'text-span',
        spanType, // TextSpanType string enum values match class names
        { hoverable: spans[i].isHoverable },
        { clickable: spans[i].isClickable },
        { pending: spans[i].isPending },
        { hovered: spans[i].isHovered },
        { clicked: spans[i].isClicked },
        { deemphasized: spans[i].isDeemphasized },
        { leftmost: isLeftmostPhrase },
        { rightmost: isRightmostPhrase },
        { ['leftmost-clicked']: leftmostClicked },
        { ['rightmost-clicked']: rightmostClicked }
      );
    }

    return spans;
  }, [line, linePhrases, phraseViewStates, phraseLinks]);

  return (
    <div className={classnames('px-2 py-2 relative whitespace-pre-wrap', className)} style={style} {...attributes}>
      { textSpans.map(span => (
        <span
          key={`${span.start}:${span.end}`}
          className={span.classes}
          data-pls-idx={span.start}
          onMouseOver={span.spanType === TextSpanType.Text ? undefined : (event: React.MouseEvent) => {
            handlePhraseAction(event, span.spanPhraseIds, PhraseAction.Hover);
          }}
          onMouseOut={span.spanType === TextSpanType.Text ? undefined : () => clearHover()}
          onClick={span.spanType === TextSpanType.Text ? undefined : (event: React.MouseEvent) => {
            event.stopPropagation();
            handlePhraseAction(event, span.spanPhraseIds, PhraseAction.Click);
          }}
          // note: only existing phrase-type spans get their context menu event handled here. the text-type span 
          //   context menu event is allowed to propagate down, and is handled by TranscriptGrid because 
          //   it can see across spans and lines to handle edge cases
          onContextMenu={span.spanType === TextSpanType.Text ? undefined : (event: React.MouseEvent) => {
            event.stopPropagation();
            if (event.preventDefault) event.preventDefault();
            handlePhraseAction(event, span.spanPhraseIds, PhraseAction.Context);
          }}
        >
          { line.text.substring(span.start, span.end) }

          {/* Count Badge - // TODO - decide if we want to keep the refcount badge // */}
          {/* { span.spanType === TextSpanType.Source && (span.displayRefCount || 0) > 1 && */}
          {/* { (span.displayRefCount || 0) > 1 &&
            <span
              data-pls-idx={span.end}
              className={classnames('count-badge', { pending: span.isPending })}
            >
              { span.displayRefCount }
            </span>
          } */}
        </span>
      )) }
    </div>
  );
};

export { HighlightableTextCell };
