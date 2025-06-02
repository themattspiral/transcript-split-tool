import classNames from 'classnames';

import { SpanType } from './data';

interface SimpleSpanBubbleProps {
  spanType: SpanType;
  children: React.ReactNode;
}

export const SimpleSpanBubble: React.FC<SimpleSpanBubbleProps> = ({ spanType, children }) => {
  const classes = classNames(
    'span-bubble simple leftmost rightmost',
    spanType, // SpanType string enum values match class names in scss file
  );

  return (
    <span className={classes}>
      { children }
    </span>
  );
};
