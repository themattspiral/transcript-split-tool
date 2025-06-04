import classNames from 'classnames';
import { CSSProperties } from 'react';

interface BadgeProps {
  children: React.ReactNode;
  mode?: 'general' | 'line-number';
  size?: 'small' | 'large';
  className?: string | undefined;
  style?: CSSProperties | undefined;
}

export const Badge: React.FC<BadgeProps> = (props) => {
  const { children, mode = 'general', size = 'small', className, style } = props;
  const classes = classNames('badge', size, { [mode]: mode !== 'general' }, className);

  return (
    <span className={classes} style={style}>
      { children }
    </span>
  );
};
