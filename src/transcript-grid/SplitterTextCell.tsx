import { CSSProperties, useMemo } from "react";
import classnames from "classnames";

import { Phrase, TranscriptLine } from "../data";

enum TextSpanType {
  Phrase = 'phrase',
  RepeatedPhrase = 'repeated',
  OverlappingPhrases = 'overlap',
  Text = 'text'
}

interface TextSpan {
  start: number;
  end: number;
  coveredPhrases: Phrase[];
  spanType: TextSpanType;
  isLeftmostPhrase: boolean;
  isRightmostPhrase: boolean;
  isPending: boolean;
  classes?: string;
}

interface SplitterTextCellProps {
  line: TranscriptLine;
  phrases?: Phrase[];
  maskIdx?: number;
  className?: string;
  style?: CSSProperties;
  attributes?: any;
}

const SplitterTextCell: React.FC<SplitterTextCellProps> = props => {
  const { line, phrases, maskIdx, className, style, attributes } = props;
  const text = line.textWithoutSpeaker || line.text;

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
      
      // find which original phrases cover this section
      const coveredPhrases: Phrase[] = [];
      
      if (phrases) {
        for (let j = 0; j < phrases.length; j++) {
          const phrase = phrases[j];
          
          // A phrase covers this section if:
          // 1. the phrase's start is less than this section's end
          // 2. the phrase's end is greater than this section's start
          //
          // i.e. fully contained, or overlapping on either side
          if (phrase.start < end && phrase.end > start) {
            coveredPhrases.push(phrase);
          }
        }
      }

      let isPending = false;
      let spanType = TextSpanType.Text;
      
      if (coveredPhrases.length === 1) {
        isPending = coveredPhrases[0].isPending; 
        spanType = coveredPhrases[0].isRepetition ? TextSpanType.RepeatedPhrase : TextSpanType.Phrase;
      } else if (coveredPhrases.length > 1) {
        isPending = coveredPhrases.some(phrase => phrase.isPending);
        spanType = TextSpanType.OverlappingPhrases;
      }
      
      spans.push({
        start,
        end,
        coveredPhrases,
        spanType,
        isLeftmostPhrase: false,
        isRightmostPhrase: false,
        isPending
      });
    }

    for (let i = 0; i < spans.length; i++) {
      spans[i].isLeftmostPhrase = spans[i].spanType != TextSpanType.Text && (i === 0 || spans[i - 1].spanType === TextSpanType.Text);
      spans[i].isRightmostPhrase = spans[i].spanType != TextSpanType.Text && (i === (spans.length - 1) || spans[i + 1].spanType === TextSpanType.Text);
      
      const spanMasked = maskIdx !== undefined && maskIdx <= spans[i].start;
      spans[i].classes = classnames(
        'whitespace-pre-wrap',
        { ['text-gray-400 select-none cursor-not-allowed']: !spans[i].isPending && spanMasked },
        { ['select-none cursor-not-allowed z-2 relative']: spans[i].isPending && spanMasked },
        { ['bg-gray-200']: spanMasked && spans[i].spanType === TextSpanType.Text },
        { ['z-1 relative']: spans[i].spanType === TextSpanType.Text },
        { ['bg-orange-200']: !spans[i].isPending && spans[i].spanType === TextSpanType.Phrase },
        { ['bg-blue-200']: !spans[i].isPending && spans[i].spanType === TextSpanType.RepeatedPhrase },
        { ['bg-fuchsia-300']: !spans[i].isPending && spans[i].spanType === TextSpanType.OverlappingPhrases },
        { ['bg-orange-100 border-orange-300 border-2 border-dashed']: spans[i].isPending && spans[i].spanType === TextSpanType.Phrase },
        { ['bg-blue-100 border-blue-300 border-2 border-dashed']: spans[i].isPending && spans[i].spanType === TextSpanType.RepeatedPhrase },
        { ['bg-fuchsia-200 border-fuchsia-400 border-2 border-dashed']: spans[i].isPending && spans[i].spanType === TextSpanType.OverlappingPhrases },
        { ['rounded-l-xl pl-[3px] ml-[-3px]']: spans[i].isLeftmostPhrase },
        { ['rounded-r-xl pr-[3px] mr-[-3px]']: spans[i].isRightmostPhrase }
      );
    }

    return spans;
  }, [line, phrases, maskIdx]);

  return (
    <div className={classnames('px-2 py-2 relative', className)} style={style} {...attributes}>
      { textSpans.map(span => (
        <span
          key={`${span.start}:${span.end}`}
          data-pls-idx={span.start}
          className={span.classes}
        >
          { text.substring(span.start, span.end) }
        </span>
      )) }
    </div>
  );
};

export { SplitterTextCell };
