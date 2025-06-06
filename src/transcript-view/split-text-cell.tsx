import { CSSProperties, useMemo } from 'react';
import classNames from 'classnames';

import { OverallPhraseRole, Phrase, PhraseLinkInfo, SpanType, SplitTextSpanBubbleDefinition, TranscriptLine } from '../shared/data';
import { useUserData } from '../context/user-data-context';
import { useTranscriptInteraction } from '../context/transcript-interaction-context';
import { EditState, useStructureEdit } from '../context/structure-edit-context';
import { SplitTextSpanBubble } from './split-text-span-bubble';

interface SplitTextCellProps {
  line: TranscriptLine;
  className?: string;
  style?: CSSProperties | undefined;
  attributes?: any;
}

export const SplitTextCell: React.FC<SplitTextCellProps> = props => {
  const { line, className, style, attributes } = props;

  const { phraseLinks, linePhrases } = useUserData();
  const { phraseViewStates } = useTranscriptInteraction();
  const { editState } = useStructureEdit();

  // flatten plain text and phrases into discreet SpanDefinitions, handling potential range overlaps 
  const spanDefinitions: SplitTextSpanBubbleDefinition[] = useMemo(() => {
    const isEditIdle = editState === EditState.Idle;
    const thisLinesPhrases = linePhrases[line.lineNumber.toString()] || [];
    const idxSpanSplitPoints = new Set<number>([0, line.text.length]);

    thisLinesPhrases?.forEach(phrase => {
      idxSpanSplitPoints.add(phrase.start);
      idxSpanSplitPoints.add(phrase.end);
    });

    const defs: SplitTextSpanBubbleDefinition[] = [];

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
      let isEmphasized = false;
      let isDeemphasized = true;
      let isPending = false;

      if (isNotTextType) {
        spanPhrases.forEach(phrase => {
          isEmphasized ||= phraseViewStates[phrase.id]?.isEmphasized || false;       // some
          isDeemphasized &&= phraseViewStates[phrase.id]?.isDeemphasized || false;   // every
          isPending ||= phraseViewStates[phrase.id]?.isPending || false;        // some
        });
      }

      defs.push({
        start,
        end,
        spanPhraseIds: spanPhrases.map(p => p.id),
        spanType,
        isPending,
        isHoverable: isNotTextType && isEditIdle,
        isClickable: isNotTextType && isEditIdle,
        isContextable: isNotTextType && isEditIdle,
        isEmphasized: isEmphasized,
        isDeemphasized: isNotTextType && isDeemphasized,
        isLeftmostSpan: false,
        isRightmostSpan: false,
        isLeftmostClickedSpan: false,
        isRightmostClickedSpan: false,
        isPreviousSpanClicked: false
      });
    }

    // determine span props that use info about neighbors (requires all spans to be defined first)
    for (let i = 0; i < defs.length; i++) {
      const spanType = defs[i].spanType;
      defs[i].isLeftmostSpan = spanType !== SpanType.Text && (i === 0 || defs[i - 1].spanType === SpanType.Text);
      defs[i].isRightmostSpan = spanType !== SpanType.Text && (i === (defs.length - 1) || defs[i + 1].spanType === SpanType.Text);

      // defs[i].isLeftmostClickedSpan = defs[i].isSelected && i > 0 && !defs[i - 1].isSelected;
      // defs[i].isRightmostClickedSpan = defs[i].isSelected && i < (defs.length - 1) && !defs[i + 1].isSelected;
      // defs[i].isPreviousSpanClicked = !defs[i].isSelected && i > 0 && defs[i - 1].isSelected;
    }
    return defs;
  }, [line, linePhrases, phraseViewStates, phraseLinks, editState]);

  const spanBubbles = useMemo(() => spanDefinitions.map(span => (
    <SplitTextSpanBubble key={`${span.start}:${span.end}`} span={span}>
      { line.text.substring(span.start, span.end) }
    </SplitTextSpanBubble>
  )), [spanDefinitions]);

  return (
    <div className={classNames('px-2 py-2 relative whitespace-pre-wrap', className)} style={style} {...attributes}>
      { spanBubbles }
    </div>
  );
};
