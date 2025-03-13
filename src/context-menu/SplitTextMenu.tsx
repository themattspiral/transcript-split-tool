import { Menu, Item, Separator, Submenu } from "react-contexify";
import { ColumnDef } from "../data";

interface SplitTextMenuProps {
  textSelectionString: string;
  groupColumnDefs: ColumnDef[];
  onNewGroup: () => void;
  onExistingGroup: (columnId: string) => void;
}

const SPLIT_MENU_ID = 'split-menu-id';

const SplitTextMenu: React.FC<SplitTextMenuProps> = (props) => {
  const { textSelectionString, groupColumnDefs, onNewGroup, onExistingGroup } = props;

  return (
    <Menu id={SPLIT_MENU_ID}>
      <Item disabled style={{ opacity: 1 }} className="font-medium">
        {textSelectionString}
      </Item>
      <Separator />
      <Item onClick={onNewGroup}>
        Create New Group...
      </Item>

      {groupColumnDefs?.length > 0 &&
        <Submenu label="Add to Existing Group">
          {groupColumnDefs.map(colDef => (
            <Item
              key={colDef.id}
              onClick={() => onExistingGroup(colDef.id)}
            >
              {colDef.label}
            </Item>
          ))}
        </Submenu>
      }
    </Menu>
  );
};

export { SPLIT_MENU_ID, SplitTextMenu };
