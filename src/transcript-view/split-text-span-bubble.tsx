import classNames from 'classnames';

import { PhraseAction, SplitTextSpanBubbleDefinition } from '../shared/data';
import { useTranscriptInteraction } from '../context/transcript-interaction-context';

interface SplitTextSpanBubbleProps {
  span: SplitTextSpanBubbleDefinition;
  children: React.ReactNode;
}

export const SplitTextSpanBubble: React.FC<SplitTextSpanBubbleProps> = ({ span, children }) => {
  const { handlePhraseAction } = useTranscriptInteraction();

  const classes = classNames(
    'span-bubble',
    span.spanType, // SpanType string enum values match class names in scss file
    {
      clickable: span.isClickable,
      pending: span.isPending,
      emphasized: span.isEmphasized,
      deemphasized: span.isDeemphasized,
      leftmost: span.isLeftmostSpan,
      rightmost: span.isRightmostSpan,
      ['previous-pending']: span.isPreviousSpanPending,
      ['next-pending']: span.isNextSpanPending
    }
  );

  return (
    <span
      // this attribute is used by the transcript grid event handler to determine the highlighted text
      data-span-start-idx={span.start}
      className={classes}
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
      { children }
    </span>
  );
};
