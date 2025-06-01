import classNames from 'classnames';

interface BadgeProps {
  children: React.ReactNode;
  mode?: 'general' | 'line-number';
}

export const Badge: React.FC<BadgeProps> = ({ children, mode = 'general' }) => {
  const classes = classNames('badge', { [mode]: mode !== 'general' });

  return (
    <span className={classes}>
      { children }
    </span>
  );
};
