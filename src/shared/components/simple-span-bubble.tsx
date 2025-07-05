import classNames from 'classnames';

import { SpanType, StylableProps } from 'data';

interface SimpleSpanBubbleProps extends StylableProps {
  spanType: SpanType;
  mode: 'general' | 'menu';
  children: React.ReactNode;
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
