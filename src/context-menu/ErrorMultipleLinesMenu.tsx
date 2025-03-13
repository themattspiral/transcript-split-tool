import { Menu, Item } from "react-contexify";

const ERROR_MULTIPLE_LINES_MENU_ID = 'multiple-lines-error-menu-id';

const ErrorMultipleLinesMenu: React.FC = () => {
  return (
    <Menu id={ERROR_MULTIPLE_LINES_MENU_ID}>
      <Item disabled>
        Please select text from a single transcript line at a time.
      </Item>
    </Menu>
  );
};

export { ERROR_MULTIPLE_LINES_MENU_ID, ErrorMultipleLinesMenu };
