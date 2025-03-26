import { CSSProperties, useCallback, useMemo } from "react";
import classnames from "classnames";

import { Phrase, TranscriptLine } from "../data/data";
import { getPhraseKey } from "../util/util";
import { useViewState } from "../ViewStateContext";
import './HighlightableTextCell.scss';

enum TextSpanType {
  Phrase = 'phrase',
  RepeatedPhrase = 'repeated-phrase',
  OverlappingPhrases = 'overlapping-phrases',
  Text = 'text'
}

interface TextSpan {
  start: number;
  end: number;
  coveredPhrases: Phrase[];
  spanType: TextSpanType;
  isPending: boolean;
  displayRefCount?: number;
  classes?: string;
}

interface HighlightableTextCellProps {
  line: TranscriptLine;
  phrases?: Phrase[];
  className?: string;
  style?: CSSProperties;
  attributes?: any;
}

const HighlightableTextCell: React.FC<HighlightableTextCellProps> = props => {
  const { line, phrases, className, style, attributes } = props;
  const text = line.textWithoutSpeaker || line.text;

  const {
    phraseLinks, pendingPhrase, pendingRepeatedPhrase, hoveredPhraseKeys, clickedPhraseKeys,
    setPendingRepeatedPhrase, setHoveredPhraseKeys, setClickedPhraseKeys
  } = useViewState();

  // flatten potential range overlaps
  const textSpans: TextSpan[] = useMemo(() => {
    const idxSpanSplitPoints = new Set<number>([0, line.text.length]);
    phrases?.forEach(phrase => {
      idxSpanSplitPoints.add(phrase.start);
      idxSpanSplitPoints.add(phrase.end);
    });

    const sortedPoints = Array.from(idxSpanSplitPoints).sort((a, b) => a - b);

    // create discrete ranges between adjacent points
    const spans: TextSpan[] = [];
    
    for (let i = 0; i < sortedPoints.length - 1; i++) {
      const start = sortedPoints[i];
      const end = sortedPoints[i + 1];
      
      // find which original phrases cover this span
      const uniqueCoveredPhrases: { [key: string]: Phrase } = {};
      if (phrases) {
        for (let j = 0; j < phrases.length; j++) {
          const phrase = phrases[j];
          
          // A phrase covers this section if:
          // 1. the phrase's start is less than this section's end
          // 2. the phrase's end is greater than this section's start
          //
          // i.e. fully contained, or overlapping on either side
          if (phrase.start < end && phrase.end > start) {
            uniqueCoveredPhrases[getPhraseKey(phrase)] = phrase;
          }
        }
      }
      const coveredPhrases = Object.values(uniqueCoveredPhrases);

      let isPending = false;
      let spanType = TextSpanType.Text;
      let refCount = undefined;
      
      if (coveredPhrases.length === 1) {
        isPending = coveredPhrases[0].isPending; 
        spanType = coveredPhrases[0].isRepetition ? TextSpanType.RepeatedPhrase : TextSpanType.Phrase;
        
        if (spanType === TextSpanType.RepeatedPhrase) {
          refCount = phraseLinks[getPhraseKey(coveredPhrases[0])]?.size;
        }
      } else if (coveredPhrases.length > 1) {
        isPending = coveredPhrases.some(phrase => phrase.isPending);
        spanType = TextSpanType.OverlappingPhrases;
      }
      
      spans.push({
        start,
        end,
        coveredPhrases,
        spanType,
        isPending,
        displayRefCount: isPending ? (refCount || 0)  + 1 : refCount
      });
    }

    // determine correct styling for each span
    for (let i = 0; i < spans.length; i++) {
      const spanType = spans[i].spanType;
      const isPending = spans[i].isPending;
      const isHighlighted = (spanType === TextSpanType.Phrase || spanType === TextSpanType.RepeatedPhrase) && hoveredPhraseKeys.has(getPhraseKey(spans[i].coveredPhrases[0]));
      const isDeemphasized = (!isHighlighted && hoveredPhraseKeys.size > 0) || (!isPending && (pendingPhrase || pendingRepeatedPhrase));
      const isLeftmostPhrase = spanType != TextSpanType.Text && (i === 0 || spans[i - 1].spanType === TextSpanType.Text);
      const isRightmostPhrase = spanType != TextSpanType.Text && (i === (spans.length - 1) || spans[i + 1].spanType === TextSpanType.Text);
      
      spans[i].classes = classnames(
        'text-span',
        spanType,
        { pending: isPending },
        { highlighted: isHighlighted },
        { deemphasized: isDeemphasized },
        { clickable: pendingPhrase && spanType === TextSpanType.RepeatedPhrase },
        { leftmost: isLeftmostPhrase },
        { rightmost: isRightmostPhrase }
      );
    }

    return spans;
  }, [line, phrases, phraseLinks, pendingPhrase, pendingRepeatedPhrase, hoveredPhraseKeys, clickedPhraseKeys]);

  const isSpanClickable = useCallback((span: TextSpan): boolean => {
    return !!pendingPhrase && span.spanType === TextSpanType.RepeatedPhrase;
  }, [pendingPhrase]);

  const handleSpanClick = useCallback((span: TextSpan): void => {
    setPendingRepeatedPhrase({ ...span.coveredPhrases[0], isPending: true });
  }, [setPendingRepeatedPhrase]);

  const handleSpanMouseOver = useCallback((span: TextSpan) => {
    const keys = new Set(span.coveredPhrases.flatMap(p => {
      const phraseKey = getPhraseKey(p);
      return [phraseKey, ...Array.from(phraseLinks[phraseKey])];
    }));

    setHoveredPhraseKeys(new Set(keys));
  }, [setHoveredPhraseKeys, phraseLinks]);

  const handleSpanMouseOut = useCallback(() => {
    setHoveredPhraseKeys(new Set());
  }, [setHoveredPhraseKeys]);

  return (
    <div  className={classnames('px-2 py-2 relative whitespace-pre-wrap', className)} style={style} {...attributes}>
      { textSpans.map(span => (
        <span
          key={`${span.start}:${span.end}`}
          className={span.classes}
          data-pls-idx={span.start}
          onClick={isSpanClickable(span) ? () => handleSpanClick(span) : undefined}
          onMouseOver={span.spanType !== TextSpanType.Text ? () => handleSpanMouseOver(span) : undefined}
          onMouseOut={span.spanType !== TextSpanType.Text ? handleSpanMouseOut : undefined}
        >
          { text.substring(span.start, span.end) }

          {/* Count Badge */}
          { span.spanType === TextSpanType.RepeatedPhrase && (span.displayRefCount || 0) > 1 &&
            <span
              data-pls-idx={span.end}
              className={classnames('count-badge', { pending: span.isPending })}
            >
              { span.displayRefCount }
            </span>
          }
        </span>
      )) }
    </div>
  );
};

export { HighlightableTextCell };
