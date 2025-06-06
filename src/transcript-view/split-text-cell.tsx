import { CSSProperties, useMemo } from 'react';
import classNames from 'classnames';

import {
  OverallPhraseRole, Phrase, PhraseLinkInfo,
  SpanType, SplitTextSpanBubbleDefinition, TranscriptLine
} from '../shared/data';
import { useTranscriptInteraction } from '../context/transcript-interaction-context';
import { EditState, useStructureEdit } from '../context/structure-edit-context';
import { SplitTextSpanBubble } from './split-text-span-bubble';
import { useUserData } from '../context/user-data-context';

interface SplitTextCellProps {
  line: TranscriptLine;
  className?: string;
  style?: CSSProperties | undefined;
  attributes?: any;
}

export const SplitTextCell: React.FC<SplitTextCellProps> = props => {
  const { line, className, style, attributes } = props;

  const { phraseLinks, linePhrases } = useUserData();
  const { editState, pendingPhraseLinks, pendingLinePhrases } = useStructureEdit();
  const { phraseViewStates } = useTranscriptInteraction();

  // flatten plain text and phrases into discreet SpanDefinitions, handling potential range overlaps 
  const spanDefinitions: SplitTextSpanBubbleDefinition[] = useMemo(() => {
    const isEditIdle = editState === EditState.Idle;
    const ln = line.lineNumber.toString();
    const thisLinesPhrases = [
      linePhrases[ln] || [],
      pendingLinePhrases[ln] || []
    ].flat();

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

      // determine this span's view state based on the collective view states of the phrases
      // associated with it. also identify any pending phrases that apply to this span
      //
      let isEmphasized = false;
      let isDeemphasized = true;
      let pendingLinkInfo: PhraseLinkInfo | null = null;

      spanPhrases.forEach(phrase => {
        isEmphasized ||= phraseViewStates[phrase.id]?.isEmphasized || false;       // some
        isDeemphasized &&= phraseViewStates[phrase.id]?.isDeemphasized || false;   // every

        // there can only be 1 pending phrase for a given span, since source and repetition can't overlap
        const info = pendingPhraseLinks[phrase.id];
        if (info) {
          pendingLinkInfo = info;
        }
      });

      // determine span type
      let spanType = SpanType.Text;

      // note: 0 span phrases means it's just plan text
      
      if (!isEditIdle && pendingLinkInfo) {
        // if there is a pending phrase here, its role overrides any others
        spanType = (pendingLinkInfo as PhraseLinkInfo).overallRole === OverallPhraseRole.Source
          ? SpanType.Source : SpanType.Repetition;
      } else if (spanPhrases.length === 1) {
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

      defs.push({
        start,
        end,
        spanPhraseIds: spanPhrases.map(p => p.id),
        spanType,
        isPending: !!pendingLinkInfo,
        isHoverable: isNotTextType && isEditIdle,
        isClickable: isNotTextType && isEditIdle,
        isContextable: isNotTextType && isEditIdle,
        isEmphasized: isEmphasized,
        isDeemphasized: isNotTextType && isDeemphasized,
        isLeftmostSpan: false,
        isRightmostSpan: false,
        isPreviousSpanPending: false,
        isNextSpanPending: false
      });
    }

    // determine span props which need info about neighbors (requires all spans to be defined first)
    for (let i = 0; i < defs.length; i++) {
      const spanType = defs[i].spanType;
      defs[i].isLeftmostSpan = spanType !== SpanType.Text && (i === 0 || defs[i - 1].spanType === SpanType.Text);
      defs[i].isRightmostSpan = spanType !== SpanType.Text && (i === (defs.length - 1) || defs[i + 1].spanType === SpanType.Text);
      defs[i].isPreviousSpanPending = i > 0 && defs[i - 1].isPending;
      defs[i].isNextSpanPending = i < (defs.length - 1) && defs[i + 1].isPending;
    }
    return defs;
  }, [line, phraseViewStates, editState, pendingPhraseLinks, pendingLinePhrases]);

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
