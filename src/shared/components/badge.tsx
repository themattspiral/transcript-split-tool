import classNames from 'classnames';

interface BadgeProps {
  children: React.ReactNode;
  mode?: 'general' | 'line-number';
  size?: 'small' | 'large';
}

export const Badge: React.FC<BadgeProps> = ({ children, mode = 'general', size = 'small' }) => {
  const classes = classNames('badge', size, { [mode]: mode !== 'general' });

  return (
    <span className={classes}>
      { children }
    </span>
  );
};
