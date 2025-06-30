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
      emphasized: span.isEmphasized,
      deemphasized: span.isDeemphasized,
      leftmost: span.isLeftmostSpan,
      rightmost: span.isRightmostSpan,
      ['under-edit']: span.isUnderEdit,
      ['previous-under-edit']: span.isPreviousSpanUnderEdit,
      ['next-under-edit']: span.isNextSpanUnderEdit
    }
  );

  return (
    <span
      // this attribute is used by the transcript grid event handler to determine the index of the highlighted text
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
      //   context menu event is allowed to propagate down, and is handled by TranscriptGrid (because 
      //   it can see across spans and lines to handle edge cases)
      onContextMenu={span.isContextable ? (event: React.MouseEvent) => {
        const sel = document.getSelection();
        const isRangeHighlighted = sel?.type === 'Range';

        // even though the user technically right-clicked this bubble, if there is a range of text highlighted, then
        // don't handle this as a phrase action. instead let TranscriptGrid handle the text selection
        if (!isRangeHighlighted) {
          event.stopPropagation();
          if (event.preventDefault) event.preventDefault();
          handlePhraseAction(event, span.spanPhraseIds, PhraseAction.Context);
        }
      } : undefined}
    >
      { children }
    </span>
  );
};
