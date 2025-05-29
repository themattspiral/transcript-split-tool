import { Menu, Item } from 'react-contexify';

import { ERROR_MULTIPLE_LINES_MENU_ID } from './context-menu';

export const ErrorMultipleLinesMenu: React.FC = () => {
  return (
    <Menu id={ERROR_MULTIPLE_LINES_MENU_ID} animation="slide">
      <Item disabled style={{ opacity: 1 }}>
        <div className="text-red-500 font-semibold font-sans">Please select text from a single transcript line at a time.</div>
      </Item>
    </Menu>
  );
};
