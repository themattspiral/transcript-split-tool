import { Menu, Item, Separator, Submenu } from "react-contexify";
import { ColumnDef } from "../data";

interface LinePartMenuProps {
  textSelectionString: string;
  columnId: string;
  groupColumnDefs: ColumnDef[];
  onRemove: () => void;
  onMove: (columnId: string) => void;
}

const LINE_PART_MENU_ID = 'line-part-menu-id';

const LinePartMenu: React.FC<LinePartMenuProps> = (props) => {
  const { textSelectionString, columnId, groupColumnDefs, onRemove, onMove } = props;
  const columnsExceptCurrent = groupColumnDefs.filter(def => def.id != columnId);

  return (
    <Menu id={LINE_PART_MENU_ID}>
      <Item disabled style={{ opacity: 1 }} className="font-medium">
        {textSelectionString}
      </Item>
      <Separator />
      <Item onClick={onRemove}>
        Delete
      </Item>

      {columnsExceptCurrent?.length > 0 &&
        <Submenu label="Change Group">
          {columnsExceptCurrent.map(colDef => (
            <Item
              key={colDef.id}
              onClick={() => onMove(colDef.id)}
            >
              {colDef.label}
            </Item>
          ))}
        </Submenu>
      }
    </Menu>
  );
};

export { LINE_PART_MENU_ID, LinePartMenu };
