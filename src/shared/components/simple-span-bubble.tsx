import { CSSProperties } from 'react';
import classNames from 'classnames';

import { SpanType } from '../../shared/data';

interface SimpleSpanBubbleProps {
  spanType: SpanType;
  mode: 'general' | 'menu';
  children: React.ReactNode;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  showEmphasized?: boolean;
  showDeemphasized?: boolean;
}

export const SimpleSpanBubble: React.FC<SimpleSpanBubbleProps> = (props) => {
  const {
    spanType, mode, children, className, style,
    showEmphasized = false, showDeemphasized = false
  } = props;

  const classes = classNames(
    'span-bubble simple leftmost rightmost',
    spanType, // SpanType string enum values match class names in scss file
    mode,
    className,
    { emphasized: showEmphasized },
    { deemphasized: showDeemphasized }
  );

  return (
    <span className={classes} style={style}>
      { children }
    </span>
  );
};
