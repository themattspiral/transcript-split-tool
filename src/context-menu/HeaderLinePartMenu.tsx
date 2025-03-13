import { Menu, Item } from "react-contexify";
import { ColumnDef } from "../data";

interface HeaderLinePartMenuProps {
  columnId: string;
  groupColumnDefs: ColumnDef[];
  onRemove: (columnId: string) => void;
}

const HEADER_LINE_PART_MENU_ID = 'header-line-part-menu-id';

const HeaderLinePartMenu: React.FC<HeaderLinePartMenuProps> = (props) => {
  const { columnId, groupColumnDefs, onRemove } = props;
  const colDef = groupColumnDefs.find(def => def.id === columnId);

  return (
    <Menu id={HEADER_LINE_PART_MENU_ID}>
      <Item onClick={() => onRemove(columnId)}>
        Delete {colDef?.label}
      </Item>
    </Menu>
  );
};

export { HEADER_LINE_PART_MENU_ID, HeaderLinePartMenu };
