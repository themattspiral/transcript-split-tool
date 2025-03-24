import { CSSProperties, useCallback, useMemo } from "react";
import classnames from "classnames";

import { getPhraseKey, Phrase, TranscriptLine } from "../data";
import { useViewState } from "../ViewStateContext";

enum TextSpanType {
  Phrase,
  RepeatedPhrase,
  OverlappingPhrases,
  Text
}

interface TextSpan {
  start: number;
  end: number;
  coveredPhrases: Phrase[];
  spanType: TextSpanType;
  isPending: boolean;
  refCount?: number;
  classes?: string;
}

interface HighlightableTextCellProps {
  line: TranscriptLine;
  phrases?: Phrase[];
  maskIdx?: number;
  className?: string;
  style?: CSSProperties;
  attributes?: any;
}

const HighlightableTextCell: React.FC<HighlightableTextCellProps> = props => {
  const { line, phrases, maskIdx, className, style, attributes } = props;
  const text = line.textWithoutSpeaker || line.text;

  const { repeatedPhraseRefCounts, pendingPhrase, setPendingRepeatedPhrase } = useViewState();

  const handleRepeatedPhraseClick = useCallback((phrase: Phrase) => {
    if (pendingPhrase) {
      setPendingRepeatedPhrase({ ...phrase, isPending: true });
    }
  }, [pendingPhrase, setPendingRepeatedPhrase]);

  // flatten potential range overlaps
  const textSpans: TextSpan[] = useMemo(() => {
    const idxSpanSplitPoints = new Set<number>([0, line.text.length]);
    phrases?.forEach(phrase => {
      idxSpanSplitPoints.add(phrase.start);
      idxSpanSplitPoints.add(phrase.end);
    });
    if (maskIdx !== undefined) {
      idxSpanSplitPoints.add(maskIdx);
    }

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
          refCount = repeatedPhraseRefCounts[getPhraseKey(coveredPhrases[0])];
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
        refCount
      });
    }

    // determine correct styling for each span
    for (let i = 0; i < spans.length; i++) {
      const isMasked = maskIdx !== undefined && maskIdx <= spans[i].start;
      const isPending = spans[i].isPending;
      const spanType = spans[i].spanType;
      const isLeftmostPhrase = spanType != TextSpanType.Text && (i === 0 || spans[i - 1].spanType === TextSpanType.Text);
      const isRightmostPhrase = spanType != TextSpanType.Text && (i === (spans.length - 1) || spans[i + 1].spanType === TextSpanType.Text);
      
      spans[i].classes = classnames(
        'whitespace-pre-wrap relative',
        { ['text-gray-400 select-none cursor-not-allowed']: !isPending && isMasked },
        { ['select-none cursor-not-allowed z-2']: isPending && isMasked },  // don't gray-out masked text for pending phrase, ensure pending parts sit over other masked parts
        { ['cursor-pointer']: !!pendingPhrase && spanType === TextSpanType.RepeatedPhrase },
        { ['bg-gray-200']: isMasked && spanType === TextSpanType.Text },
        { ['z-1']: spanType === TextSpanType.Text },  // ensure text (w/ transparent bg) sits on top of extended phrase bubble padding
        { ['bg-orange-200']: !isPending && spanType === TextSpanType.Phrase },
        { ['bg-blue-200']: !isPending && spanType === TextSpanType.RepeatedPhrase },
        { ['bg-fuchsia-300']: !isPending && spanType === TextSpanType.OverlappingPhrases },
        { ['bg-orange-100 border-orange-300 border-2 border-dashed']: isPending && spanType === TextSpanType.Phrase },
        { ['bg-blue-100 border-blue-300 border-2 border-dashed']: isPending && spanType === TextSpanType.RepeatedPhrase },
        { ['bg-fuchsia-200 border-fuchsia-400 border-2 border-dashed']: isPending && spanType === TextSpanType.OverlappingPhrases },
        { ['rounded-l-xl pl-[3px] ml-[-3px]']: isLeftmostPhrase },
        { ['rounded-r-xl pr-[3px] mr-[-3px]']: isRightmostPhrase }
      );
    }

    return spans;
  }, [line, phrases, maskIdx, repeatedPhraseRefCounts, pendingPhrase]);

  return (
    <div  className={classnames('px-2 py-2 relative', className)} style={style} {...attributes}>
      { textSpans.map(span => (
        <span
          key={`${span.start}:${span.end}`}
          className={span.classes}
          data-pls-idx={span.start}
          onClick={() => {
            if (span.spanType === TextSpanType.RepeatedPhrase) {
              handleRepeatedPhraseClick(span.coveredPhrases[0]);
            }
          }}
        >
          { text.substring(span.start, span.end) }

          {/* Count Badge */}
          { span.spanType === TextSpanType.RepeatedPhrase &&
            <span
              className={classnames(
                'inline-block w-[15px] h-[15px] rounded-[15px] z-3',
                'font-sans text-[10px] text-center pb-[1px]',
                'absolute top-[-8px] right-[-6px] bg-gray-100 border-gray-700',
                span.isPending ? 'border-1 border-dashed' : 'border-1'
              )}
            >
              { span.isPending ? (span.refCount || 0)  + 1 : span.refCount }
            </span>
          }
        </span>
      )) }
    </div>
  );
};

export { HighlightableTextCell };
