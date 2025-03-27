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
  isHoverable: boolean;
  isClickable: boolean;
  isHovered: boolean;
  isClicked: boolean;
  isDeemphasized: boolean;
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
    setPendingPhrase, setPendingRepeatedPhrase, setHoveredPhraseKeys, setClickedPhraseKeys
  } = useViewState();

  const isSpanClickable = useCallback((spanType: TextSpanType, pending: Phrase | null, pendingRepeated: Phrase | null): boolean => {
    let clickable = true;
    
    if (spanType === TextSpanType.Text) {
      clickable = false;
    } else if (pending && spanType !== TextSpanType.RepeatedPhrase) {
      clickable = false;
    } else if (pendingRepeated && spanType !== TextSpanType.Phrase) {
      clickable = false;
    } else if ((pending || pendingRepeated) && spanType === TextSpanType.OverlappingPhrases) {
      clickable = false;
    }

    return clickable;
  }, []);

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

      const isShowingPendingBar = !!pendingPhrase || !!pendingRepeatedPhrase;

      const isSingleHovered = (spanType === TextSpanType.Phrase || spanType === TextSpanType.RepeatedPhrase) && hoveredPhraseKeys.has(getPhraseKey(coveredPhrases[0]));
      const isMultiHovered = (spanType === TextSpanType.OverlappingPhrases) && coveredPhrases.some(p => hoveredPhraseKeys.has(getPhraseKey(p)));
      const isHovered = isSingleHovered || isMultiHovered;
      
      const isSingleClicked = (spanType === TextSpanType.Phrase || spanType === TextSpanType.RepeatedPhrase) && clickedPhraseKeys.has(getPhraseKey(coveredPhrases[0]));
      const isMultiClicked = (spanType === TextSpanType.OverlappingPhrases) && coveredPhrases.some(p => clickedPhraseKeys.has(getPhraseKey(p)));
      const isClicked = isSingleClicked || isMultiClicked;

      const isDeemphasized = (!isHovered && hoveredPhraseKeys.size > 0) || (!isPending && isShowingPendingBar);
      
      spans.push({
        start,
        end,
        coveredPhrases,
        spanType,
        isPending,
        isHoverable: spanType !== TextSpanType.Text,
        isClickable: isSpanClickable(spanType, pendingPhrase, pendingRepeatedPhrase),
        isHovered,
        isClicked,
        isDeemphasized,
        displayRefCount: isPending ? (refCount || 0)  + 1 : refCount
      });
    }

    // determine styling for each span
    for (let i = 0; i < spans.length; i++) {
      const spanType = spans[i].spanType;
      const isLeftmostPhrase = spanType != TextSpanType.Text && (i === 0 || spans[i - 1].spanType === TextSpanType.Text);
      const isRightmostPhrase = spanType != TextSpanType.Text && (i === (spans.length - 1) || spans[i + 1].spanType === TextSpanType.Text);
      
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
        { rightmost: isRightmostPhrase }
      );
    }

    return spans;
  }, [line, phrases, phraseLinks, pendingPhrase, pendingRepeatedPhrase, isSpanClickable, hoveredPhraseKeys, clickedPhraseKeys]);

  const handleSpanClick = useCallback((event: React.MouseEvent, span: TextSpan): void => {
    event.stopPropagation();

    if (pendingPhrase && !pendingRepeatedPhrase) { 
      // replace pending repeated phrase
      setPendingRepeatedPhrase({ ...span.coveredPhrases[0], isPending: true });
    } else if (!pendingPhrase && pendingRepeatedPhrase) {
      // replace pending phrase
      setPendingPhrase({ ...span.coveredPhrases[0], isPending: true });
    } else if (span.isClicked) {
      setClickedPhraseKeys(new Set());
    } else {
      // select click
      const keys = new Set(span.coveredPhrases.flatMap(p => {
        const phraseKey = getPhraseKey(p);
        return [phraseKey, ...Array.from(phraseLinks[phraseKey] || new Set())];
      }));

      setClickedPhraseKeys(keys);
    }
  }, [pendingPhrase, pendingRepeatedPhrase, setPendingPhrase, setPendingRepeatedPhrase, setClickedPhraseKeys]);

  const handleSpanMouseOver = useCallback((span: TextSpan) => {
    const keys = new Set(span.coveredPhrases.flatMap(p => {
      const phraseKey = getPhraseKey(p);
      return [phraseKey, ...Array.from(phraseLinks[phraseKey] || new Set())];
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
          onMouseOver={span.isHoverable ? () => handleSpanMouseOver(span) : undefined}
          onMouseOut={span.isHoverable ? handleSpanMouseOut : undefined}
          onClick={span.isClickable ? event => handleSpanClick(event, span) : undefined}
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
