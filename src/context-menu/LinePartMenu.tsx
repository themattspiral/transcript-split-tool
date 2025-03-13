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

  return (
    <Menu id={LINE_PART_MENU_ID}>
      <Item disabled className="text-black">
        {textSelectionString}
      </Item>
      <Separator />
      <Item onClick={onRemove}>
        Delete
      </Item>

      {groupColumnDefs?.length > 0 &&
        <Submenu label="Change Group">
          {groupColumnDefs.map(colDef => {
            if (colDef.id === columnId) {
              return null;
            } else {
              return (
                <Item
                  key={colDef.id}
                  onClick={() => onMove(colDef.id)}
                >
                  {colDef.label}
                </Item>
              );
            }
          })}
        </Submenu>
      }
    </Menu>
  );
};

export { LINE_PART_MENU_ID, LinePartMenu };
