import { CSSProperties, ReactNode } from 'react';
import classNames from 'classnames';

interface BadgeProps {
  children: ReactNode;
  mode?: 'general' | 'line-number';
  size?: 'small' | 'large';
  className?: string | undefined;
  style?: CSSProperties | undefined;
}

export const Badge: React.FC<BadgeProps> = (props) => {
  const { children, mode = 'general', size = 'small', className, style } = props;
  const childrenStringLength = children?.toString().length || 0;
  const classes = classNames(
    'badge',
    size,
    { [mode]: mode !== 'general' },
    { 'large-xlong': mode === 'line-number' && childrenStringLength === 4 },
    { 'large-2xlong': mode === 'line-number' && childrenStringLength >= 5 },
    className
  );

  return (
    <span className={classes} style={style}>
      { children }
    </span>
  );
};
